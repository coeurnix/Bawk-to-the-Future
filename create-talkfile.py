#!/usr/bin/env python3
import argparse
import json
import re
import struct
import subprocess
import tempfile
import wave
from pathlib import Path


VISEME_TARGETS = {
    "A": "AA_VI_01_PP",
    "B": "AA_VI_07_SS",
    "C": "AA_VI_11_E",
    "D": "AA_VI_10_aa",
    "E": "AA_VI_13_O",
    "F": "AA_VI_14_U",
    "G": "AA_VI_02_FF",
    "H": "AA_VI_04_DD",
    "X": "AA_VI_00_Sil",
}

JAW_OPEN_BY_SHAPE = {
    "C": 0.34,
    "D": 0.50,
    "E": 0.32,
    "H": 0.36,
}


def output_stem(value: str) -> Path:
    path = Path(value)
    if path.suffix in {".json", ".mp3"}:
        return path.with_suffix("")
    return path


def strip_parentheticals(caption: str) -> str:
    cleaned = re.sub(r"\([^)]*\)", " ", caption)
    return re.sub(r"\s+", " ", cleaned).strip()


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        text=True,
        capture_output=True,
    )
    return round(float(result.stdout.strip()), 3)


def create_mp3(input_wav: Path, output_mp3: Path) -> float:
    output_mp3.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(input_wav),
            "-ac",
            "1",
            "-ar",
            "24000",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "96k",
            str(output_mp3),
        ]
    )
    return probe_duration(output_mp3)


def run_rhubarb(input_wav: Path, dialog: str, output_json: Path) -> dict:
    with tempfile.TemporaryDirectory() as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        dialog_file = temp_dir / "dialog.txt"
        rhubarb_output = temp_dir / "rhubarb.json"
        dialog_file.write_text(f"{dialog}\n", encoding="utf-8")
        run(
            [
                "rhubarb",
                "-f",
                "json",
                "--extendedShapes",
                "GHX",
                "-q",
                "-d",
                str(dialog_file),
                "-o",
                str(rhubarb_output),
                str(input_wav),
            ]
        )
        output_json.parent.mkdir(parents=True, exist_ok=True)
        return json.loads(rhubarb_output.read_text(encoding="utf-8"))


def decode_pcm_samples(frames: bytes, sample_width: int, channels: int) -> list[float]:
    if sample_width == 1:
        samples = [byte - 128 for byte in frames]
    elif sample_width == 2:
        samples = list(struct.unpack(f"<{len(frames) // 2}h", frames))
    elif sample_width == 3:
        samples = []
        for index in range(0, len(frames), 3):
            raw = int.from_bytes(frames[index : index + 3], byteorder="little", signed=False)
            if raw & 0x800000:
                raw -= 0x1000000
            samples.append(raw)
    elif sample_width == 4:
        samples = list(struct.unpack(f"<{len(frames) // 4}i", frames))
    else:
        raise ValueError(f"Unsupported WAV sample width: {sample_width}")

    if channels <= 1:
        return [float(sample) for sample in samples]

    mono = []
    for index in range(0, len(samples), channels):
        channel_samples = samples[index : index + channels]
        mono.append(float(sum(channel_samples)) / len(channel_samples))
    return mono


def rms(samples: list[float]) -> float:
    if not samples:
        return 0.0
    return (sum(sample * sample for sample in samples) / len(samples)) ** 0.5


def wav_rms_by_range(input_wav: Path, ranges: list[tuple[float, float]]) -> list[float]:
    with wave.open(str(input_wav), "rb") as wav:
        sample_rate = wav.getframerate()
        sample_width = wav.getsampwidth()
        channels = wav.getnchannels()
        results = []
        for start, end in ranges:
            start_frame = max(0, int(start * sample_rate))
            end_frame = max(start_frame + 1, int(end * sample_rate))
            wav.setpos(min(start_frame, wav.getnframes()))
            frames = wav.readframes(min(end_frame, wav.getnframes()) - min(start_frame, wav.getnframes()))
            if not frames:
                results.append(0.0)
                continue
            results.append(rms(decode_pcm_samples(frames, sample_width, channels)))
    return results


def normalized_volumes(input_wav: Path, cues: list[dict]) -> list[float]:
    rms_values = wav_rms_by_range(input_wav, [(cue["start"], cue["end"]) for cue in cues])
    voiced_values = [value for cue, value in zip(cues, rms_values) if cue["shape"] != "X" and value > 0]
    reference = max(voiced_values) if voiced_values else 1.0
    return [min(1.0, value / reference) for value in rms_values]


def jaw_open_for(shape: str, volume: float) -> float:
    base = JAW_OPEN_BY_SHAPE.get(shape)
    if base is None:
        return 0.0
    return round(base * (0.35 + 0.65 * volume), 3)


def build_talkfile(caption: str, duration: float, rhubarb_data: dict, audio_name: str, input_wav: Path) -> dict:
    cues = []
    for cue in rhubarb_data.get("mouthCues", []):
        shape = str(cue["value"])
        morph_target = VISEME_TARGETS.get(shape, "AA_VI_00_Sil")
        cues.append(
            {
                "start": round(float(cue["start"]), 3),
                "end": round(float(cue["end"]), 3),
                "shape": shape,
                "morphTarget": morph_target,
            }
        )

    volumes = normalized_volumes(input_wav, cues)
    for cue, volume in zip(cues, volumes):
        cue["volume"] = round(volume, 3)
        cue["jawOpen"] = jaw_open_for(cue["shape"], volume)

    if not cues or cues[-1]["end"] < duration:
        cues.append(
            {
                "start": cues[-1]["end"] if cues else 0,
                "end": duration,
                "shape": "X",
                "morphTarget": "AA_VI_00_Sil",
                "volume": 0,
                "jawOpen": 0,
            }
        )

    return {
        "version": 1,
        "caption": caption,
        "duration": duration,
        "audio": audio_name,
        "tweenSeconds": 0.18,
        "smoothing": "client applies damped morph smoothing after cue tweening",
        "jawOpenMorphTarget": "SR_21_Jaw_Open",
        "shapeMap": VISEME_TARGETS,
        "cues": cues,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a RocketBox NPC talkfile JSON and matching 24 kHz mono MP3."
    )
    parser.add_argument("input_wav", type=Path)
    parser.add_argument("-o", "--output", required=True, help="Output stem, .json path, or .mp3 path.")
    parser.add_argument("-s", "--caption", required=True, help="Caption text to store in the talkfile.")
    args = parser.parse_args()

    input_wav = args.input_wav
    stem = output_stem(args.output)
    output_json = stem.with_suffix(".json")
    output_mp3 = stem.with_suffix(".mp3")

    rhubarb_dialog = strip_parentheticals(args.caption) or args.caption
    rhubarb_data = run_rhubarb(input_wav, rhubarb_dialog, output_json)
    duration = create_mp3(input_wav, output_mp3)
    talkfile = build_talkfile(args.caption, duration, rhubarb_data, output_mp3.name, input_wav)
    output_json.write_text(f"{json.dumps(talkfile, indent=2)}\n", encoding="utf-8")

    print(f"Wrote {output_json}")
    print(f"Wrote {output_mp3}")


if __name__ == "__main__":
    main()

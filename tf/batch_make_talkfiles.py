#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path


def run(command: list[str]) -> None:
    print(" ".join(str(part) for part in command))
    subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch-create talkfile JSON/MP3 outputs from a dialogue/audio map."
    )
    parser.add_argument(
        "dialogue_map",
        type=Path,
        help="Path to JSON array with entries like {'dialogue': '...', 'audio': 'dialogue-1-00.wav'}.",
    )
    parser.add_argument(
        "--script",
        type=Path,
        default=Path("make_talkfile.py"),
        help="Path to your single-file talk generator script. Default: make_talkfile.py",
    )
    parser.add_argument(
        "--exports",
        type=Path,
        default=Path("exports"),
        help="Directory containing WAV files. Default: exports",
    )
    parser.add_argument(
        "--outputs",
        type=Path,
        default=Path("outputs"),
        help="Directory where output stems are written. Default: outputs",
    )
    parser.add_argument(
        "--python",
        default=sys.executable,
        help="Python executable used to run the generator script. Default: current Python",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Keep processing remaining files if one item fails.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without running them.",
    )
    args = parser.parse_args()

    if not args.dialogue_map.exists():
        raise FileNotFoundError(f"Dialogue map not found: {args.dialogue_map}")

    if not args.script.exists():
        raise FileNotFoundError(f"Generator script not found: {args.script}")

    entries = json.loads(args.dialogue_map.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("Dialogue map must be a JSON array.")

    args.outputs.mkdir(parents=True, exist_ok=True)

    failures: list[tuple[str, str]] = []

    for index, entry in enumerate(entries, start=1):
        try:
            dialogue = entry["dialogue"]
            audio_name = entry["audio"]
        except KeyError as error:
            message = f"Entry {index} is missing required key: {error}"
            if args.continue_on_error:
                failures.append((f"entry-{index}", message))
                print(f"ERROR: {message}", file=sys.stderr)
                continue
            raise ValueError(message) from error

        input_wav = args.exports / audio_name
        output_stem = args.outputs / Path(audio_name).stem

        if not input_wav.exists():
            message = f"Missing WAV: {input_wav}"
            if args.continue_on_error:
                failures.append((audio_name, message))
                print(f"ERROR: {message}", file=sys.stderr)
                continue
            raise FileNotFoundError(message)

        command = [
            args.python,
            str(args.script),
            str(input_wav),
            "-o",
            str(output_stem),
            "-s",
            "\"" + dialogue + "\"",
        ]

        try:
            if args.dry_run:
                print(" ".join(str(part) for part in command))
            else:
                run(command)
        except subprocess.CalledProcessError as error:
            message = f"Command failed with exit code {error.returncode}"
            if args.continue_on_error:
                failures.append((audio_name, message))
                print(f"ERROR: {audio_name}: {message}", file=sys.stderr)
                continue
            raise

    if failures:
        print("\nCompleted with failures:", file=sys.stderr)
        for audio_name, message in failures:
            print(f"- {audio_name}: {message}", file=sys.stderr)
        sys.exit(1)

    print(f"\nDone. Processed {len(entries)} entries into: {args.outputs}")


if __name__ == "__main__":
    main()

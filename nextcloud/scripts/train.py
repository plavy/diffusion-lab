import sys
import time
import json

METADATA_FILE = 'metadata.json'

def train(args):
  with open(METADATA_FILE, 'r') as f:
    metadata = json.load(f)
  max_steps = int(metadata["hyperparameter:maxSteps"])
  for i in range(1, max_steps + 1):
    print(f'{args[0]} {i}')
    with open(METADATA_FILE, 'w') as f:
      metadata["trainingProgress"] = round(i / max_steps * 100)
      metadata["trainingDone"] = False
      json.dump(metadata, f, indent=2)
    time.sleep(1)

  with open(METADATA_FILE, 'w') as f:
    metadata["trainingDone"] = True
    json.dump(metadata, f)

if __name__ == "__main__":
  args = sys.argv[1:]
  train(args)

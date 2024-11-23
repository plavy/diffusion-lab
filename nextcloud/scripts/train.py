import sys
import time
import json

def train(args):
  max_steps = 100
  for i in range(1, max_steps + 1):
    time.sleep(1)
    print(f'{args[0]} {i}')
    with open('progress.json', 'w') as f:
      json.dump({"step": i, "max_steps": max_steps, "done": False}, f)

  with open('progress.json', 'w') as f:
    json.dump({"done": True}, f)

if __name__ == "__main__":
  args = sys.argv[1:]
  train(args)

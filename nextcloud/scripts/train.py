import sys
import time

def train(args):
  for i in range(1, 21):
    time.sleep(1)
    print(f'{args[0]} {i}')

if __name__ == "__main__":
  args = sys.argv[1:]
  train(args)

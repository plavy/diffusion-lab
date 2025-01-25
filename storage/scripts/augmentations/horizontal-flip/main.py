from torchvision import transforms

def construct():
  return transforms.RandomHorizontalFlip(p=0.5)
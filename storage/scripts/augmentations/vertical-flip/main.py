from torchvision import transforms

def construct():
  return transforms.RandomVerticalFlip(p=0.5)
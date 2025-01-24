from torchvision import transforms

def augment():
  return transforms.RandomVerticalFlip(p=0.5)
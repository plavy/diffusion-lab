from torchvision import transforms

def augment():
  return transforms.RandomHorizontalFlip(p=0.5)
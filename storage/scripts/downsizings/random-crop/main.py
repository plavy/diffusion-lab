from torchvision import transforms

def construct(x, y):
  return transforms.RandomCrop((x, y))
from torchvision import transforms

def construct(x, y):
  return transforms.CenterCrop((x, y))
from torchvision import transforms

def construct(x, y):
  return transforms.Resize((x, y))
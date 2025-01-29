import os
import argparse

from torchvision import transforms

from utils import get_metadata, load_model

def sample(args):
    checkpoint_dir = os.path.join('lightning_logs', 'version_0', 'checkpoints')
    trained_model_path = os.path.join(checkpoint_dir, os.listdir(checkpoint_dir)[0])
    if not os.path.exists(trained_model_path):
        print('ERROR Trained model not found.')
        exit(1)
        return

    os.makedirs(args.save_dir, exist_ok=True)

    batch_size = int(args.number)

    def on_progress_change(i, n):
        progress_file = os.path.join(args.save_dir, f'{args.base_name}-progress.txt')
        with open(progress_file, 'w') as f:
            f.write(str(round((n - i) / n * 100)))

    model_class = load_model(get_metadata('metadata.json').get('model')).get_class()
    model = model_class.load_from_checkpoint(checkpoint_path=trained_model_path)
    
    model.cuda()
    out=model(batch_size=batch_size, shape=model.hparams.sample_shape, verbose=False, progress_callback=on_progress_change)

    transform = transforms.ToPILImage()

    for i in range(batch_size):
        pil_img = transform(out[i].detach().cpu())
        pil_img.save(os.path.join(args.save_dir, f'{args.base_name}-{i}.jpg'))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sample images from model")
    parser.add_argument("--save-dir", required=True, help="Directory to save images")
    parser.add_argument("--base-name", required=True, help="Base name of images")
    parser.add_argument("--number", required=True, help="Number of images")
    
    args = parser.parse_args()
    sample(args)

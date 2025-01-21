import sys
import os
import argparse

from webdav3.client import Client

def ensure_dataset(args):
    dav = Client({
        'webdav_hostname': args.dav_url,
        'webdav_login':    args.dav_username,
        'webdav_password': args.dav_password,
    })

    os.makedirs(args.dataset_dir, exist_ok=True)

    list = dav.list(args.dataset_dir, get_info=True)
    dirs = []
    files = []
    for file in list:
        print(file)
        print(file.get('path'))
        if file.get('isdir'):
            dirs.append(file.get('path'))
        else:
            files.append(file.get('path'))
    print(dirs)
    print(files)
    
    # print('Pulling dataset from WebDAV server')
    # dav.pull(local_directory=args.dataset_dir, remote_directory=args.dataset_dir)
    print('Done')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a model")
    parser.add_argument("--dav-url", required=True, help="URL of WebDAV server")
    parser.add_argument("--dav-username", required=True, help="Username for WebDAV server")
    parser.add_argument("--dav-password", required=True, help="Password for WebDAV server")
    parser.add_argument("--dataset-dir", required=True, help="Path to dataset directory")
    
    args = parser.parse_args()
    ensure_dataset(args)

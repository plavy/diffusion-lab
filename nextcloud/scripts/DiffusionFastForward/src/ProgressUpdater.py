import json

from pytorch_lightning import Callback

from webdav3.client import Client


class ProgressUpdater(Callback):
  def __init__(self, args):
    self.args = args

  def get_metadata(self):
    with open(self.args.metadata_file, 'r') as f:
        metadata = json.load(f)
    return metadata

  def set_metadata(self, key, value):
      metadata = self.get_metadata()
      metadata[key] = value
      with open(self.args.metadata_file, 'w') as f:
          json.dump(metadata, f, indent=2)

  def on_train_epoch_end(self, trainer, pl_module):
    try:   
      progress = round(trainer.global_step / trainer.estimated_stepping_batches * 100)
      self.set_metadata("trainingProgress", progress)
      self.set_metadata("trainingDone", False)

      # Set up WebDAV connection
      dav = Client({
          'webdav_hostname': self.args.dav_url,
          'webdav_login':    self.args.dav_username,
          'webdav_password': self.args.dav_password,
      })
      dav.upload_sync(local_path=self.args.metadata_file, remote_path=self.args.metadata_file)
    except:
      print('ERROR WebDAV server unreachable.')

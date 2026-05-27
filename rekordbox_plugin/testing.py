from pyrekordbox import MasterDatabase

# from pyrekordbox.config import update_config

# update_config(
#     "C:\\Program Files\\rekordbox\\rekordbox 7.2.14",
#     "C:\\Users\\Finn\\Documents\\rekordbox",
# )

db = MasterDatabase()

for content in db.get_content():
    print(content.Title, content.Artist.Name)

playlist = db.get_playlist()[0]
for song in playlist.Songs:
    content = song.Content
    print(content.Title, content.Artist.Name)

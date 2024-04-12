# Marine Databaser

## 👀 Overview

A cross-platform Electron application that allows marine biology researchers to categorize and analyze
video, audio, and other files collected in the field entirely on device. This program includes
functions for quickly splicing videos for analysis, extracting audio from videos, and a database for
storing and categorizing files. This project is being completed under the supervision of Professor
Phillip Lobel, professor of marine biology at Boston University.

The project utlizes a React frontend with MUI components, and a SQLite database. To perform video
and audio operations, the project uses FFMPEG, a free and open-source software project that produces
libraries and programs for handling multimedia data.

## 📝 Features

Here is a (mostly exhaustive) list of features that are currently implemented:
- Database for storing and categorizing files
- File tagging and notes system
- File renaming
- Searching and filtering files by name, tags, directories, file types, notes, and file parent
- Support for adding multiple directories, including external drives, to the database
- Support for refreshing the database to reflect changes in the file system
- Support for setting a new location of a directory in case it is moved
- Video splicing operations facilitated by FFMPEG; this allows 1 hour videos to be spliced
  into an arbitrary number of smaller clips in a matter of seconds
  - users can free seek to a specific time in the video
  - users can seek frame-by-frame, or by 1, 5, or 10 seconds
  - users can create splice regions via timestamps or frame number
  - users can use the audio waveform and spectrogram to help them find splice regions
  - splices points are intelligently inserted by default so that one splice region starts as the
    previous one ends
  - videos are spliced in the same format as the original video, without re-encoding
  - users can undo/redo up to 256 steps in video splicing tool
  - users can save/load video splicing projects
  - incompatible formats can be detected and converted to a compatible format on the fly
  - automatically tracking files created by video splicing operations in the database if they're output
    to a directory tracked by the database (file parents and file children)
- Audio extraction from videos facilitated by FFMPEG
  - users can choose different export formats and destinations
  - automatically tracking files created by audio extraction operations in the database if they're output
    to a directory tracked by the database (file parents and file children)
- Import/Export the entire database to a sqlite file for easy backup and transfer to new devices
- Reset database to clear all data and start fresh
- Experimental: Automated video splicing using basic audio analysis including amplitude and frequency
  analysis


## 📷 Screenshots

The following screenshots demonstrate the current state of the application.

![Files](/public/files.png)

![Directories](/public/directories.png)

![Extract Audio](/public/extract-audio.png)

![Splice Video](/public/splice-video.png)

![Incompatible Format](/public/incompatible-format.png)

## 🛫 Quick start

A pre-built version of the application is available for download on the releases
page: https://github.com/ptrandev/marine-databaser/releases

To run the application locally in a development environment, clone the repository
and run the following commands:

```bash
# Install dependencies
npm install

# Run the application in development mode
npm run dev
```

Alternatively, you can create a production build for your platform by running
the following command:

```bash
npm run build
```

This will produce a build in the `release` directory. You can then run the
executable file in the `release` directory to run the application.
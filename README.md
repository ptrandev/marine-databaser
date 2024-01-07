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

Here is a list of features that are currently implemented:
- Database for storing and categorizing files
- File tagging and notes system
- File renaming
- Searching and filtering files by name, tags, directories, file types, and notes
- Support for adding multiple directories, including external drives, to the database
- Support for refreshing the database to reflect changes in the file system
- Video splicing operations facilitated by FFMPEG; this allows 1 hour videos to be spliced
  into an arbitrary number of smaller clips in a matter of seconds
  - users can free seek to a specific time in the video
  - users can seek frame-by-frame, or by 1, 5, or 10 seconds
  - users can create splice points via timestamps or frame number
  - splices points are intelligently inserted by default so that one splice point starts as the
    previous one ends
  - videos are spliced in the same format as the original video, without re-encoding
- Audio extraction from videos facilitated by FFMPEG
  - users can choose different export formats and destinations
- Import/Export the entire database to a sqlite file for easy backup and transfer to new devices
- Experimental: Automated video splicing using basic audio analysis including amplitude and frequency
  analysis

Here is a list of features that are currently being worked on:
- "Collections" system for grouping files together and giving them to other researchers
- Support for undo/redo operations in video splicing tool
- support for saving/loading video splicing projects
- support for bulk rename file operations
- automatically tracking files created by video splicing operations in the database


## 📷 Screenshots

The following screenshots demonstrate the current state of the application.

![Files](/public/files.png)

![Directories](/public/directories.png)

![Extract Audio](/public/extract-audio.png)

![Splice Video](/public/splice-video.png)


## 🛫 Quick start

An official build of the application is not yet available. To run the application
locally, clone the repository and run the following commands:

```bash
# Install dependencies
npm install

# Run the application in development mode
npm run dev
```

At the moment, the database is stored in a local file called `src/assets/data/database.sqlite`.
In a future iteration, this will be configurable by the user.
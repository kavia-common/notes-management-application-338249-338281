#!/bin/bash
cd /home/kavia/workspace/code-generation/notes-management-application-338249-338281/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


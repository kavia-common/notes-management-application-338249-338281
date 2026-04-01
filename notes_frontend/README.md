# Notes Frontend (React)

A modern, lightweight notes UI (header + tags sidebar + note list + note detail + editor modal).

## Backend connectivity

This frontend expects the FastAPI backend to be running on:

- `http://localhost:3001`

The API client is implemented in `src/api/client.js` and currently targets `/notes` routes:
- `GET /notes`
- `POST /notes`
- `PUT /notes/{id}`
- `DELETE /notes/{id}`

If those endpoints are not present yet, the UI will still run in a demo (in-memory) mode and will show a toast indicating the backend is not ready.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode on port 3000.

### `npm run build`

Builds the app for production.

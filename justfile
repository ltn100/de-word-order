# German Word Order Learning App - Development Commands

# Default recipe - show available commands
default:
    @just --list

# Install all dependencies
install:
    npm install

# Start the development server
dev:
    npm run dev

# Build for production
build:
    npm run build

# Run the production build locally
preview:
    npm run preview

# Run linter
lint:
    npm run lint

# Type check without emitting
typecheck:
    npx tsc --noEmit

# Clean build artifacts and node_modules
clean:
    rm -rf node_modules dist .parcel-cache

# Full reset - clean and reinstall
reset: clean install

# Build for GitHub Pages with relative paths
gh-pages:
    npm run build -- --base=./

# Serve the built dist folder locally (for testing gh-pages build)
serve:
    cd dist && python3 -m http.server 8000

#!/bin/bash

# 1. LIMPIEZA DE CARACTERES ESPECIALES (CRLF)
sed -i 's/\r$//' .env 2>/dev/null
sed -i 's/\r$//' deploy_scripts/server_update.sh 2>/dev/null

# 2. CARGAR VARIABLES DESDE .ENV
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "ERROR CRITICO: No se encontro el archivo .env en el VPS."
    exit 1
fi

# Configuracion
TOKEN=$(echo ${GITHUB_TOKEN:-""} | tr -d '\r')
REPO=$(echo ${GITHUB_REPO:-"jpupper/jpupperwebsite"} | tr -d '\r')
APP_NAME="jpupperwebsite"
REPO_URL="https://$TOKEN@github.com/$REPO"

echo "------------------------------------------------"
echo "DEPLOY: $APP_NAME (Repo: $REPO)"
echo "------------------------------------------------"

# 3. ACTUALIZACION DE GIT
if [ ! -d ".git" ]; then
    echo "Clonando repositorio por primera vez..."
    git init
    git remote add origin "$REPO_URL"
    git fetch origin main
    git checkout -f main
else
    echo "Actualizando repositorio..."
    git remote set-url origin "$REPO_URL"
    git fetch origin main
    git reset --hard origin/main
fi

# 4. INSTALACION DE DEPENDENCIAS
echo "Instalando dependencias..."
npm install

# 5. REINICIO TOTAL DE PM2
echo "Reestableciendo instancia de PM2..."
pm2 delete "$APP_NAME" 2>/dev/null
# JPUpper uses server.js directly (CommonJS)
if [ -f "server.js" ]; then
    pm2 start server.js --name "$APP_NAME"
else
    echo "ERROR: No se encontro server.js en la raiz."
    exit 1
fi
pm2 save

echo "------------------------------------------------"
echo "DEPLOY FINALIZADO CON EXITO"
echo "------------------------------------------------"
pm2 list
echo "------------------------------------------------"

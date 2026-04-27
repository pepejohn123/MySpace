# Deployment del frontend en AWS Amplify

Este repo contiene un frontend estático en:

```text
Develop 2/frontend
```

No requiere `npm install`, build, Vite, React ni bundler. AWS Amplify Hosting puede publicar directamente esa carpeta y redeployar automáticamente cada vez que haya push a GitHub.

## Archivos de deploy agregados

- `amplify.yml`: indica a Amplify que publique `Develop 2/frontend` como carpeta final.
- `Develop 2/frontend/index.html`: entrada raíz del sitio; redirige a `pages/login/Login.html`.

## Configurar AWS Amplify

1. Entra a **AWS Amplify**.
2. Selecciona **Host web app**.
3. Conecta **GitHub**.
4. Autoriza el acceso al repo `Federico2003/MySpace`.
5. Selecciona la rama que se usará para deploy, por ejemplo:

   ```text
   proyecto-local
   ```

6. En la configuración de build, deja que Amplify use el archivo `amplify.yml` del repo.
7. Mantén la raíz de la app en la raíz del repositorio. El `amplify.yml` ya publica `Develop 2/frontend`.
8. Ejecuta el primer deploy.

Después de eso, cada push a la rama configurada redeployará el frontend automáticamente.

## Flujo normal de trabajo

```bash
git add amplify.yml "Develop 2/frontend/index.html" DEPLOYMENT.md
git commit -m "Add Amplify frontend deployment config"
git push origin proyecto-local
```

## CORS del backend

Cuando Amplify genere la URL del sitio, por ejemplo:

```text
https://branch-id.amplifyapp.com
```

verifica que API Gateway/Lambdas acepten ese origin. Si el backend usa CORS restringido, agrega el dominio de Amplify a `Access-Control-Allow-Origin` y permite al menos estos headers:

```text
Authorization, Content-Type
```

Si el backend ya responde con `Access-Control-Allow-Origin: *`, probablemente no necesitas cambiar nada.

## Configuración del frontend

La configuración actual está en:

```text
Develop 2/frontend/js/config.js
```

Ahí se define `API_BASE_URL`, región de Cognito, User Pool ID y Client ID. Estos valores son usados por el navegador, por lo que no deben incluir secretos privados.

## Validación después del deploy

- Abrir la URL de Amplify.
- Confirmar que `/` redirige a `pages/login/Login.html`.
- Confirmar que cargan CSS y JS.
- Iniciar sesión y revisar que las llamadas a API Gateway no fallen por CORS.
- Hacer un cambio pequeño, pushearlo y confirmar que Amplify redeploya automáticamente.
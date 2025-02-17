export default async function server(request) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en" class="dark">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nexus - Global Delivery Platform</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://esm.sh/vue@3.3.4/dist/vue.global.prod.js"></script>
          <script>
            tailwind.config = {
              darkMode: 'class',
            }
          </script>
        </head>
        <body class="dark:bg-gray-900">
          <div id="root"></div>
          <script src="https://esm.town/v/std/catch"></script>
          <script type="module" src="${import.meta.url}"></script>
        </body>
      </html>
    `, {
      headers: { 
        "content-type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
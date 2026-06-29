sed -i '/import {NotebookView} from ".\/components\/wave\/notebook";/a import {StatusBar} from ".\/components\/status-bar";' lib/index.tsx
sed -i 's/<\/div>\n  );\n};/      <StatusBar \/>\n    <\/div>\n  );\n};/g' lib/index.tsx

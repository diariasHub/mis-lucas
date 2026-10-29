import react from '/home/claude/proj/mis-lucas/node_modules/@vitejs/plugin-react/dist/index.js'
export default {
  root: '/home/claude/proj/mis-lucas/.preview',
  plugins: [react()],
  resolve: { alias: [
    { find: /^\.\.\/data\/datos$/, replacement: '/home/claude/proj/mis-lucas/.preview/datosMock.ts' },
    { find: /^\.\.\/firebase$/, replacement: '/home/claude/proj/mis-lucas/.preview/firebaseMock.ts' },
  ] },
  server: { fs: { allow: ['/'] } },
}

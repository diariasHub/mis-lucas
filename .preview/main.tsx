import { createRoot } from 'react-dom/client'
import '/home/claude/proj/mis-lucas/src/index.css'
import Panel from '/home/claude/proj/mis-lucas/src/components/Panel'
createRoot(document.getElementById('root')!).render(<Panel user={{ uid: 'x', email: 'diego@example.com' } as any} />)

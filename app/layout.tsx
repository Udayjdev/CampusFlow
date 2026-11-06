import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'CampusFlow — A campus in sync',description:'Find the right room, coordinate academic schedules and keep every student informed. DDUGU smart campus prototype.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

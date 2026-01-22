import { Outlet } from 'react-router-dom'
import ScrollToTop from '../components/common/ScrollToTop'

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />  
      <Outlet />
    </>
  )
}

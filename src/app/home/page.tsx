import { redirect } from 'next/navigation'

export default function HomeRedirect() {
  // Redirect /home to the main home page
  redirect('/')
}

import MainLayout from '@/Layouts/MainLayout'
import { Head } from '@inertiajs/react'
import DeleteUserForm from './Partials/DeleteUserForm'
import UpdatePasswordForm from './Partials/UpdatePasswordForm'
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm'
import { defaultStyle } from '../Styles/DefaultStyles'

const Edit = ({ mustVerifyEmail, status }) => {
  return (
    <>
      <Head title="Profile" />
      <div className="py-0">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          <div className="p-4 sm:rounded-lg sm:p-8">
            <UpdateProfileInformationForm
              mustVerifyEmail={mustVerifyEmail}
              status={status}
              className="max-w-xl"
              style={defaultStyle}
            />
          </div>

          <div className=" bg-transparent text-foreground p-4  sm:rounded-lg sm:p-8">
            <UpdatePasswordForm className="max-w-xl" style={defaultStyle} />
          </div>

          <div className=" bg-transparent text-foreground p-4  sm:rounded-lg sm:p-8">
            <DeleteUserForm
              className={`max-w-xl ${defaultStyle.text}`}
              style={defaultStyle}
            />
          </div>
        </div>
      </div>
    </>
  )
}

Edit.layout = (page) => <MainLayout children={page} />
export default Edit

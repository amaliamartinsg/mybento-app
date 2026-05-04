import { Navigate, Route, Routes } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../api/profile'
import CategoriesSection from '../components/settings/CategoriesSection'
import ProfileSection from '../components/settings/ProfileSection'
import UnitWeightsSection from '../components/settings/UnitWeightsSection'

function SettingsView() {
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  return (
    <Box sx={{ p: 3, maxWidth: 680, mx: 'auto', pb: 10 }}>
      <Routes>
        <Route
          path="profile"
          element={
            <>
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              )}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {(error as Error).message}
                </Alert>
              )}
              {profile && <ProfileSection profile={profile} />}
            </>
          }
        />
        <Route path="categories" element={<CategoriesSection />} />
        <Route path="unit-weights" element={<UnitWeightsSection />} />
        <Route index element={<Navigate to="profile" replace />} />
      </Routes>
    </Box>
  )
}

export default SettingsView

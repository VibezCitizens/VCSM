import React from 'react'

export function howToPublicRoutes({
  HowToCreateProfileScreen,
  HowToCreateVportScreen,
  VportCategoryLandingScreen,
}) {
  return [
    {
      path: '/how-to/create-profile',
      element: <HowToCreateProfileScreen />,
    },
    {
      path: '/how-to/create-vport',
      element: <HowToCreateVportScreen />,
    },
    {
      path: '/vport/:type',
      element: <VportCategoryLandingScreen />,
    },
  ]
}

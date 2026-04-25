import React from 'react'

export function howToPublicRoutes({ HowToCreateProfileScreen, HowToCreateVportScreen }) {
  return [
    {
      path: '/how-to/create-profile',
      element: <HowToCreateProfileScreen />,
    },
    {
      path: '/how-to/create-vport',
      element: <HowToCreateVportScreen />,
    },
  ]
}

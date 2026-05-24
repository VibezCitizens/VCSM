export function joinPublicRoutes({ JoinBarbershopScreen }) {
  return [
    {
      path: '/join/barbershop/:token',
      element: <JoinBarbershopScreen />,
    },
  ]
}

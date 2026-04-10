export function legalPublicRoutes({ LegalDocumentScreen }) {
  return [
    {
      path: '/legal/:docType',
      element: <LegalDocumentScreen />,
    },
  ]
}

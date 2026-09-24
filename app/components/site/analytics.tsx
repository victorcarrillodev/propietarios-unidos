/** Google Analytics (GA4) y Contentsquare (antes Hotjar). Solo se renderiza si hay ID configurado; ver Analytics en root.tsx. */
export function Analytics({ gaId, contentsquareTagId }: { gaId?: string; contentsquareTagId?: string }) {
  return (
    <>
      {gaId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}
      {contentsquareTagId && <script async src={`https://t.contentsquare.net/uxa/${contentsquareTagId}.js`} />}
    </>
  );
}

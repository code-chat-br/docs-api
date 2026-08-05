import Script from 'next/script';

type GoogleTagProps = {
  id: string;
};

export function GoogleTag({ id }: GoogleTagProps) {
  if (!id) return null;

  return (
    <>
      <Script
        id="google-tag-loader"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-tag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
          `,
        }}
      />
    </>
  );
}

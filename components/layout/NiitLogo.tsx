interface NiitLogoProps {
  compact?: boolean;
}

export default function NiitLogo({ compact }: NiitLogoProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="text-white font-extrabold text-xl tracking-tight leading-none">
            Ni<span style={{ color: '#F7661E' }}>i</span>T
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Wordmark + accent bar */}
      <div className="relative inline-flex flex-col">
        {/* Accent bar — top-right of lettering */}
        <div className="self-end mb-0.5 mr-0" style={{ marginBottom: '-2px' }}>
          <div
            style={{
              width: 36,
              height: 5,
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #F7661E 0%, #FB8A4B 100%)',
            }}
          />
        </div>
        {/* Wordmark */}
        <span
          style={{
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Ni<span style={{ color: '#F7661E' }}>i</span>T
        </span>
      </div>
      {/* Tagline */}
      <span
        style={{
          color: '#F7661E',
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        NITRETAÇÃO A PLASMA
      </span>
    </div>
  );
}

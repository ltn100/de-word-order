import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCode.css';

export function QRCode() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="share-button"
        onClick={() => setIsOpen(true)}
        aria-label="Share"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
        Share
      </button>

      {isOpen && (
        <div className="qr-overlay" onClick={() => setIsOpen(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="qr-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>Share this app</h3>
            <p>Scan the QR code to open on another device</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value="https://ltn100.github.io/de-word-order/"
                size={180}
                bgColor="var(--bg-card)"
                fgColor="var(--text-primary)"
                level="L"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

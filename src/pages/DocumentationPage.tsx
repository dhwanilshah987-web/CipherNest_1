import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Lock,
  Layers,
  HardDrive,
  Key,
  Cloud,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCode,
  FileText,
  Server,
  FolderTree,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useVault } from '../context/VaultContext';

export const DocumentationPage: React.FC = () => {
  const { settings } = useVault();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'crypto' | 'blocks' | 'storage' | 'comparison' | 'cloud-evolution'
  >('overview');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
            Engineering & Security Documentation
          </h2>
          <Badge variant="default" size="sm">Technical Reference</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono">
          Detailed architectural breakdown of the client-side encryption pipeline, block
          segmentation algorithms, cryptographic key hierarchy, and integrity guarantees.
        </p>
      </div>

      {/* S3 Bucket Info Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-lg p-3 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-brand-400 shrink-0" />
          <span>Bucket: <strong className="text-white">{settings.bucketName || 'secureblock-demo-bucket'}</strong></span>
          <span className="text-slate-500">•</span>
          <span>Region: <strong className="text-white">{settings.awsRegion || 'us-east-1'}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>Operating Mode:</span>
          <span className="text-amber-400 font-semibold">Demo Environment (Local Vault)</span>
        </div>
      </div>

      {/* Visual Pipeline Flowchart Card */}
      <Card
        title="SecureBlock Cloud Cryptographic Data Pipeline"
        subtitle="End-to-end execution flow representing the exact browser implementation"
      >
        <div className="py-2">
          {/* Visual Step-by-Step Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] mb-2">
                1
              </div>
              <h4 className="font-bold text-slate-900">Select Real File</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                File bytes read into an <code>ArrayBuffer</code> in memory via FileReader API.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] mb-2">
                2
              </div>
              <h4 className="font-bold text-slate-900">SHA-256 Digest</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Pre-encryption 256-bit cryptographic digest calculated as benchmark.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px] mb-2">
                3
              </div>
              <h4 className="font-bold text-slate-900">AES-256-GCM Encrypt</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Encrypted with fresh 96-bit random IV and 256-bit symmetric key + 16B auth tag.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] mb-2">
                4
              </div>
              <h4 className="font-bold text-slate-900">Block Segmentation</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Ciphertext sliced into numbered blocks; per-block SHA-256 digests computed.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[11px] mb-2">
                5
              </div>
              <h4 className="font-bold text-slate-900">IndexedDB Persistence</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Wrapped keys and ciphertext blocks stored across transactional object stores.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] mb-2">
                6
              </div>
              <h4 className="font-bold text-slate-900">Block Validation</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Stored blocks retrieved in strict index sequence; checksums verified.
              </p>
            </div>

            {/* Step 7 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px] mb-2">
                7
              </div>
              <h4 className="font-bold text-slate-900">Key Unwrap & Decrypt</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Unwrapped under Master Vault Key. AES-GCM verifies authentication tag.
              </p>
            </div>

            {/* Step 8 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative group">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] mb-2">
                8
              </div>
              <h4 className="font-bold text-slate-900">SHA-256 Comparison</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Reconstructed file digest compared against original hash for MATCH verdict.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Topic Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'overview', label: '1. Objective & Threat Model' },
          { key: 'crypto', label: '2. AES-256-GCM & IVs' },
          { key: 'blocks', label: '3. Block Sizing & Hashes' },
          { key: 'storage', label: '4. IndexedDB & Key Vault' },
          { key: 'comparison', label: '5. Browser vs. AWS S3' },
          { key: 'cloud-evolution', label: '6. Enterprise Cloud Evolution' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card title="1. Project Objective and What SecureBlock Cloud Does">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900 font-semibold">SecureBlock Cloud</strong> is a
                demonstration of zero-knowledge, client-side encrypted cloud storage designed for a
                third-year Computer Engineering Cloud Computing mini-project.
              </p>
              <p>
                In conventional cloud architectures, files are often sent unencrypted over HTTPS to a
                server, where the cloud provider encrypts them at rest. While this protects against physical
                hard drive theft, the cloud provider holds the decryption keys, leaving data vulnerable to
                subpoenas, insider threats, or server-side compromise.
              </p>
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-950 space-y-2">
                <span className="font-bold text-blue-900 block">The Core Security Paradigm:</span>
                <p>
                  SecureBlock Cloud shifts encryption to the <em>untrusted boundary edge</em> (the
                  client). Plaintext bytes never touch storage. Instead, data is encrypted and split into
                  blocks before persistence. The storage system only ever sees high-entropy ciphertext
                  blocks and cryptographic hashes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: AES-256-GCM & IVs */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          <Card title="2. AES-256-GCM and the Mathematical Imperative of Random IVs">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900 font-semibold">AES (Advanced Encryption Standard)</strong> with
                a 256-bit key in <strong>Galois/Counter Mode (GCM)</strong> is an Authenticated Encryption
                with Associated Data (AEAD) algorithm.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 text-xs">Confidentiality via CTR Mode</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    AES-GCM encrypts an incrementing counter value using the 256-bit key to generate a
                    keystream, which is then XORed with the plaintext. This turns block cipher AES into a
                    stream cipher.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 text-xs">Authenticity via Galois Hash (GMAC)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    AES-GCM computes a 128-bit authentication tag over the ciphertext using universal
                    hashing in a finite field $GF(2^{128})$. If even a single bit of ciphertext is
                    altered, decryption immediately rejects the payload.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Why Random IV (Initialization Vector) Reuse is Fatal</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  In GCM mode, reusing the same key and same IV on two different files generates identical
                  keystreams ($K$). An adversary XORing both ciphertexts ($C_1 \oplus C_2$) cancels out the
                  keystream, leaving $P_1 \oplus P_2$, which leaks significant plaintext structure. Even worse,
                  nonce reuse in GCM allows an attacker to solve polynomial equations in $GF(2^{128})$ and recover
                  the GHASH authentication key!
                </p>
                <p className="text-[11px] font-semibold text-rose-900">
                  Solution in SecureBlock Cloud: Every upload generates a fresh, cryptographically secure 96-bit
                  (12-byte) IV using <code>crypto.getRandomValues()</code>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Block Sizing & Hashes */}
      {activeTab === 'blocks' && (
        <div className="space-y-6">
          <Card title="3. Block Segmentation and SHA-256 Integrity Verification">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Modern cloud storage engines (like AWS S3 Multipart Upload or Google Cloud Storage Resumable
                Uploads) divide large objects into independent chunks. SecureBlock Cloud applies this principle
                to encrypted payloads:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900 block text-xs">Block Level Deduplication & Parallelism</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dividing encrypted payloads into 1 KiB, 64 KiB, 1 MiB, or 4 MiB blocks enables independent
                    verification, parallel network transfer simulation, and granular corruption detection.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900 block text-xs">Avalanche Effect of SHA-256</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    SHA-256 exhibits the strict avalanche criterion: changing a single bit in the input produces
                    a pseudo-random digest where each output bit changes with 50% probability.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">Block Object Naming Convention:</span>
                <p className="text-emerald-400">
                  vault/{'{fileId}'}/blocks/block-0001.enc (Size: 65,536 B, SHA-256: 7f83b165...)
                </p>
                <p className="text-emerald-400">
                  vault/{'{fileId}'}/blocks/block-0002.enc (Size: 65,536 B, SHA-256: 3a910e14...)
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: IndexedDB & Key Vault */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <Card title="4. IndexedDB as a Client-Side Object Vault & Key-Wrapping Hierarchy">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Browser <code>localStorage</code> is limited to 5 MB of synchronous strings, which would freeze
                the UI when handling binary files. Instead, SecureBlock Cloud utilizes <strong>IndexedDB</strong>,
                an asynchronous transactional NoSQL engine capable of storing gigabytes of raw binary{' '}
                <code>ArrayBuffer</code> objects and native <code>CryptoKey</code> references.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Key Wrapping Architecture (Enveloping):</h4>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span><strong>Master Vault Key:</strong> Generated once and held in IndexedDB as a non-extractable <code>CryptoKey</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span><strong>Per-File Encryption Key (DEK):</strong> Generated uniquely for each file upload using 256-bit AES.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span><strong>Key Wrapping:</strong> The file key is wrapped using AES-GCM under the Master Vault Key with a unique wrapping IV before persistence. Raw keys are never stored in plaintext!</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <Card title="5. Browser Object Vault vs. AWS S3 Cloud Storage" padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Dimension</th>
                    <th className="py-3 px-6">SecureBlock Cloud (Browser Vault)</th>
                    <th className="py-3 px-6">Production AWS S3 + KMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-6 font-semibold text-slate-900">Storage Backend</td>
                    <td className="py-3 px-6 text-slate-700">Client-Side IndexedDB Object Stores</td>
                    <td className="py-3 px-6 text-slate-700">Distributed AWS S3 Buckets / Cloud Disks</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-semibold text-slate-900">Key Management</td>
                    <td className="py-3 px-6 text-slate-700">Origin-scoped Master Key wrapping DEKs</td>
                    <td className="py-3 px-6 text-slate-700">AWS KMS Hardware Security Modules (FIPS 140-2)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-semibold text-slate-900">Access Boundary</td>
                    <td className="py-3 px-6 text-slate-700">Same-Origin Policy (Protocol + Host + Port)</td>
                    <td className="py-3 px-6 text-slate-700">IAM Policies, Bucket Policies, Presigned URLs</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-semibold text-slate-900">Durability & Redundancy</td>
                    <td className="py-3 px-6 text-slate-700">Tied to single browser profile & disk</td>
                    <td className="py-3 px-6 text-slate-700">99.999999999% (11 9s) across Availability Zones</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-semibold text-slate-900">Network Transmission</td>
                    <td className="py-3 px-6 text-slate-700">Zero network bytes — 100% offline local</td>
                    <td className="py-3 px-6 text-slate-700">TLS 1.3 encrypted multipart REST endpoints</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 6: Cloud Evolution */}
      {activeTab === 'cloud-evolution' && (
        <div className="space-y-6">
          <Card title="6. Enterprise Cloud Evolution: From Frontend Sandbox to AWS Architecture">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                In a production cloud deployment, the client-side encryption algorithms developed in
                SecureBlock Cloud can be combined with true enterprise cloud infrastructure:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">1. AWS KMS Envelope Encryption Integration</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Instead of a local browser master key, the application calls <code>kms:GenerateDataKey</code>{' '}
                    to receive a plaintext 256-bit key and a KMS-encrypted ciphertext key. The browser encrypts
                    the file, destroys the plaintext key from memory, and uploads only the encrypted data key.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">2. S3 Multipart Upload with Presigned URLs</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Each segmented block is uploaded directly from the browser to an Amazon S3 bucket using
                    presigned S3 PUT URLs. The central server never handles file ciphertext, reducing server
                    bandwidth costs to near zero.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">3. Server-Side Zero-Knowledge Verification</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    S3 object ETag headers verify the MD5/SHA-256 of uploaded parts, while DynamoDB records the
                    file manifest, block ordering, and cryptographic checksums without ever having access to
                    the decryption keys.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

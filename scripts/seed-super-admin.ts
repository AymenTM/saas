import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Missing Firebase Admin environment variables in .env.local')
  process.exit(1)
}

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
})

const auth = getAuth(app)
const db = getFirestore(app)

async function seed() {
  const superAdminEmail = process.argv[2] || 'admin@parksub.com'
  const superAdminPassword = process.argv[3] || 'SuperAdmin2026!'
  const superAdminName = 'Super Admin'

  console.log(`🚀 Seeding Super Admin user: ${superAdminEmail}...`)

  try {
    // 1. Create System Company
    const companyRef = await db.collection('companies').add({
      name: 'ParkSub Master System',
      plan: 'enterprise',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log(`✅ Created Master Company ID: ${companyRef.id}`)

    // 2. Create Auth User
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(superAdminEmail)
      console.log(`ℹ️ Auth user already exists: ${userRecord.uid}`)
    } catch {
      userRecord = await auth.createUser({
        email: superAdminEmail,
        password: superAdminPassword,
        displayName: superAdminName,
      })
      console.log(`✅ Created Auth User UID: ${userRecord.uid}`)
    }

    // 3. Create User Document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      companyId: companyRef.id,
      uid: userRecord.uid,
      email: superAdminEmail,
      name: superAdminName,
      role: 'super_admin',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    console.log(`✅ Created Firestore User Document!`)
    console.log(`\n🎉 Super Admin bootstrap complete!`)
    console.log(`   Email:    ${superAdminEmail}`)
    console.log(`   Password: ${superAdminPassword}`)
    console.log(`   Company:  ${companyRef.id}`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

seed()

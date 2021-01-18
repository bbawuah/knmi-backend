import dotenv from 'dotenv'
dotenv.config()
import ee from '@google/earthengine'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
const PORT = process.env.PORT || 3000

const app = express()

const origin = 'http://localhost:8080' || 'https://project-knmi.netlify.app'

const privateKey = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(new RegExp('\\\\n', 'g'), '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  oken_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
}

app.use(cors({ origin, credentials: true }))
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// '2019-06-06'
app.post('/mapId', async (req, res) => {
  try {
    const collection = ee
      .ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')
      .select('NO2_column_number_density')
      .filterDate(req.body.dates[0], req.body.dates[1])

    collection.getMap(
      {
        min: 0,
        max: 0.0002,
        palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
      },
      (response: any) => {
        console.log(response)
        res.status(200).send({ mapId: response.mapid })
      }
    )
  } catch (e) {
    console.log(e)
    res.status(500).send(e)
  }
})

ee.data.authenticateViaPrivateKey(
  privateKey,
  () => {
    console.log('running')
    console.log('Authentication successful.')
    ee.initialize(
      null,
      null,
      () => {
        console.log('Earth Engine client library initialized.')
        app.listen(PORT)
        console.log(`Listening on port ${PORT}`)
      },
      (err: any) => {
        console.log(err)
        console.log(
          `Please make sure you have created a service account and have been approved.
  Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`
        )
      }
    )
  },
  (err: any) => {
    console.error('Authentication error: ' + err)
  }
)

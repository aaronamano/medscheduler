# Overview
My mom, who is a nurse, suggested a project idea that helps organize what prescription(s) a patient needs to take and when they need to take it. My mom told me she took care of a patient who was a grandma, and her son presents a physical and organized paper copy of her prescriptions, along with pictures, and how often she needs to take them with dosage. As a result, my mom was inspired and proposed the idea to me.

<b>Why</b>: Helps nurses like my mom streamline the process of creating customized prescription plans for patients while adjusting them if needed, providing flexibility. She thinks it can benefit patients who forget to take their meds.

<b>Who</b>: Mostly for patients who need a constant reminder of taking such medications prescribed to them. Also for people who have overwhelming amounts of prescriptions they need to take and have to memorize various routines (e.g. take this medication every x days, while taking this medication every month, etc.)

<b>Where do you see this project in the future?</b>: I expect this project to be integrated in the healthcare industry with real patients/clients using this app.

# Use Cases
- add medication
- delete medication
- edit medication
- download grid as pdf file
- enter medication name
   - as the user is typing, list of medications should be auto-suggested to them
- enter amount needed (e.g. 100 mg)
- enter when to take medication
   - frequency (e.g. take 2 times a day)
   - duration (e.g. from 6/7/25 to 8/7/25)
- insert image
- enter additional notes

## Extra Use Cases
- [Google calendar API](https://developers.google.com/workspace/calendar/api/guides/overview) integration
- login/signup with Google
- search for medication image (AI powered search)

# Database Schema
i am using MongoDB
## `Accounts` collection
schema for account
```typescript
{
  _id: ObjectID(),
  firstName: String,
  lastName: String,
  email: String,
  password: String, // encrypted
  chart: [{
    _id: ObjectID(), // create id of medication
    medication: String, // name of the medicine
    dosage: String, // e.g. "100 mg"
    frequency: String // e.g. "twice a day"
    duration: {
      startDate: ISODate(), // date for patient to start taking x medication
      endDate: ISODate() // date for patient to stop taking x medication
    },
    notes: String, // add additional notes
    imageUrl: String, // url of the image
    createdAt: ISODate(), // metadata 
    updatedAt: ISODate() // metadata 
  }] // set chart as an empty array when creating a new account
}
```

## `Medicines` collection
i imported a kaggle dataset


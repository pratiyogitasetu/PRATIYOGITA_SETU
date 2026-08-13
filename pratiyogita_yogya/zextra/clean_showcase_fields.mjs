import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI");

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("pratiyogita_yogya");
    
    // EXCLUDES catalog
    const collections = await db.listCollections().toArray();
    
    const fieldsToRemoveRoot = [
      "exam_sector",
      "full_form",
      "exam_level",
      "exam_frequency_year",
      "exam_target",
      "updated_at",
      "ministry_department",
      "post_name",
      "post_code",
      "group",
      "exam_tiers",
      "exam_subjects",
      "exam_sections",
      "exam_pattern",
      "mode_of_exam",
      "paper_medium",
      "exam_duration",
      "exam_date",
      "total_marks",
      "number_of_questions",
      "marking_scheme"
    ];

    const fieldsToRemoveNested = [
      "ministry_department",
      "post_name",
      "post_code",
      "group",
      "exam_tiers",
      "exam_subjects",
      "exam_sections",
      "exam_pattern",
      "mode_of_exam",
      "paper_medium",
      "exam_duration",
      "exam_date",
      "total_marks",
      "number_of_questions",
      "marking_scheme"
    ];

    for (const collInfo of collections) {
      if (collInfo.name.includes("catalog")) continue;
      
      const examsCol = db.collection(collInfo.name);
      const exams = await examsCol.find({}).toArray();
      if (exams.length === 0) continue;
      
      console.log(`Processing collection: ${collInfo.name} with ${exams.length} exams`);

      for (let exam of exams) {
        let updated = false;

        // Remove from root
        for (const field of fieldsToRemoveRoot) {
          if (field in exam) {
            delete exam[field];
            updated = true;
          }
        }

        // Remove from academies nested objects
        if (exam.academies) {
          for (const academy in exam.academies) {
            for (const field of fieldsToRemoveNested) {
              if (field in exam.academies[academy]) {
                delete exam.academies[academy][field];
                updated = true;
              }
            }
          }
        }

        if (updated) {
          await examsCol.replaceOne({ _id: exam._id }, exam);
          console.log(`Updated exam: ${exam._id} in ${collInfo.name}`);
        }
      }
    }
    console.log("Cleanup complete!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

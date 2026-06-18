// ---------------------------------------------------------------------------
// Shared mock data — replace with real API calls / Prisma queries
// ---------------------------------------------------------------------------

export interface Student {
  id: string;
  studentName: string;
  admissionNumber: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  class: string;
  division: string;
}

export interface Vehicle {
  id: string;
  vehicleName: string;
}

export interface FeeTemplateItem {
  name: string;
  amount: number;
}

export interface FeeTemplate {
  id: string;
  name: string;
  items: FeeTemplateItem[];
}

// StudentEnrollment view (after admission is created)
export interface StudentCharge {
  id: string;
  chargeType: string;
  originalAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  student: Student;
  academicYear: string;
  classId: string;
  division: string;
  feeStructureName: string;
  vehicleName: string;
  charges: StudentCharge[];
}

// ---------------------------------------------------------------------------

export const MOCK_STUDENTS: Student[] = [
  { id: "1",  studentName: "Aarav Menon",     admissionNumber: "ADM2024001", gender: "Male",   dob: "2014-05-12", bloodGroup: "O+",  fatherName: "Suresh Menon",    fatherMobile: "+91 98765 11111", motherName: "Anita Menon",    motherMobile: "+91 98765 11112", whatsappNumber: "9876543210", address: "Ernakulam, Kerala",           status: "ACTIVE",   class: "Class 1", division: "A" },
  { id: "2",  studentName: "Bhavya Krishnan", admissionNumber: "ADM2024002", gender: "Female", dob: "2015-08-22", bloodGroup: "A+",  fatherName: "Ramesh Nair",     fatherMobile: "+91 98765 22221", motherName: "Lakshmi Nair",   motherMobile: "+91 98765 22222", whatsappNumber: "9845123456", address: "Thrissur, Kerala",            status: "ACTIVE",   class: "Class 2", division: "B" },
  { id: "3",  studentName: "Chinmay Nair",    admissionNumber: "ADM2024003", gender: "Male",   dob: "2013-11-03", bloodGroup: "B+",  fatherName: "Vinod Nair",      fatherMobile: "+91 98765 33331", motherName: "Geetha Nair",    motherMobile: "+91 98765 33332", whatsappNumber: "9712345678", address: "Thiruvananthapuram, Kerala",  status: "INACTIVE", class: "Class 3", division: "A" },
  { id: "4",  studentName: "Divya Pillai",    admissionNumber: "ADM2024004", gender: "Female", dob: "2014-02-18", bloodGroup: "AB+", fatherName: "Mohan Pillai",    fatherMobile: "+91 96321 47895", motherName: "Seetha Pillai",  motherMobile: "+91 96321 47896", whatsappNumber: "9632147895", address: "Kozhikode, Kerala",           status: "ACTIVE",   class: "Class 1", division: "B" },
  { id: "5",  studentName: "Eshan Varma",     admissionNumber: "ADM2024005", gender: "Male",   dob: "2015-07-30", bloodGroup: "O-",  fatherName: "Rajan Varma",     fatherMobile: "+91 95587 41236", motherName: "Meena Varma",    motherMobile: "+91 95587 41237", whatsappNumber: "9558741236", address: "Kollam, Kerala",              status: "ACTIVE",   class: "Class 2", division: "A" },
  { id: "6",  studentName: "Fathima Beevi",   admissionNumber: "ADM2024006", gender: "Female", dob: "2014-09-14", bloodGroup: "B-",  fatherName: "Ismail Beevi",    fatherMobile: "+91 94478 52136", motherName: "Zainab Beevi",   motherMobile: "+91 94478 52137", whatsappNumber: "9447852136", address: "Malappuram, Kerala",          status: "INACTIVE", class: "Class 1", division: "C" },
  { id: "7",  studentName: "Gautam Suresh",   admissionNumber: "ADM2024007", gender: "Male",   dob: "2013-04-05", bloodGroup: "A-",  fatherName: "Suresh Kumar",    fatherMobile: "+91 93874 12563", motherName: "Radha Suresh",   motherMobile: "+91 93874 12564", whatsappNumber: "9387412563", address: "Palakkad, Kerala",            status: "ACTIVE",   class: "Class 3", division: "B" },
  { id: "8",  studentName: "Hima Das",        admissionNumber: "ADM2024008", gender: "Female", dob: "2016-01-20", bloodGroup: "O+",  fatherName: "Das Pillai",      fatherMobile: "+91 92741 56832", motherName: "Priya Das",      motherMobile: "+91 92741 56833", whatsappNumber: "9274156832", address: "Kannur, Kerala",              status: "ACTIVE",   class: "Class 1", division: "A" },
  { id: "9",  studentName: "Irfan Kutty",     admissionNumber: "ADM2024009", gender: "Male",   dob: "2014-12-08", bloodGroup: "AB-", fatherName: "Kutty Mohammed",  fatherMobile: "+91 91623 45789", motherName: "Salmah Kutty",   motherMobile: "+91 91623 45790", whatsappNumber: "9162345789", address: "Kasaragod, Kerala",           status: "INACTIVE", class: "Class 2", division: "C" },
  { id: "10", studentName: "Janaki Iyer",     admissionNumber: "ADM2024010", gender: "Female", dob: "2015-03-27", bloodGroup: "A+",  fatherName: "Iyer Subramanian",fatherMobile: "+91 90512 34567", motherName: "Kamala Iyer",    motherMobile: "+91 90512 34568", whatsappNumber: "9051234567", address: "Idukki, Kerala",              status: "ACTIVE",   class: "Class 2", division: "A" },
  { id: "11", studentName: "Kiran Mohan",     admissionNumber: "ADM2024011", gender: "Male",   dob: "2013-08-15", bloodGroup: "B+",  fatherName: "Mohan Kumar",     fatherMobile: "+91 89876 54321", motherName: "Savitha Mohan",  motherMobile: "+91 89876 54322", whatsappNumber: "8987654321", address: "Wayanad, Kerala",             status: "ACTIVE",   class: "Class 4", division: "A" },
  { id: "12", studentName: "Lakshmi Devi",    admissionNumber: "ADM2024012", gender: "Female", dob: "2014-06-11", bloodGroup: "O+",  fatherName: "Devi Prasad",     fatherMobile: "+91 88754 12369", motherName: "Radha Devi",     motherMobile: "+91 88754 12370", whatsappNumber: "8875412369", address: "Pathanamthitta, Kerala",      status: "ACTIVE",   class: "Class 1", division: "B" },
  { id: "13", studentName: "Manoj Kumar",     admissionNumber: "ADM2024013", gender: "Male",   dob: "2013-10-22", bloodGroup: "A+",  fatherName: "Kumar Swamy",     fatherMobile: "+91 87625 41893", motherName: "Latha Kumar",    motherMobile: "+91 87625 41894", whatsappNumber: "8762541893", address: "Alappuzha, Kerala",           status: "INACTIVE", class: "Class 3", division: "C" },
  { id: "14", studentName: "Nisha Thomas",    admissionNumber: "ADM2024014", gender: "Female", dob: "2015-05-03", bloodGroup: "B+",  fatherName: "Thomas Varghese", fatherMobile: "+91 86532 14789", motherName: "Mary Thomas",    motherMobile: "+91 86532 14790", whatsappNumber: "8653214789", address: "Kottayam, Kerala",            status: "ACTIVE",   class: "Class 2", division: "B" },
  { id: "15", studentName: "Omkar Pillai",    admissionNumber: "ADM2024015", gender: "Male",   dob: "2014-11-17", bloodGroup: "O-",  fatherName: "Pillai Krishnadas",fatherMobile: "+91 85412 37896", motherName: "Vimala Pillai",  motherMobile: "+91 85412 37897", whatsappNumber: "8541237896", address: "Ernakulam, Kerala",           status: "ACTIVE",   class: "Class 5", division: "A" },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "v1", vehicleName: "Bus 01 · KL07AB1234" },
  { id: "v2", vehicleName: "Bus 02 · KL07AB5678" },
  { id: "v3", vehicleName: "Van 01 · KL07CD9012" },
  { id: "v4", vehicleName: "Van 02 · KL07CD3456" },
];

export const MOCK_FEE_TEMPLATES: FeeTemplate[] = [
  {
    id: "t1",
    name: "Standard fee structure",
    items: [
      { name: "Tuition fee",  amount: 10000 },
      { name: "Library fee",  amount: 500   },
      { name: "Sports fee",   amount: 300   },
    ],
  },
  {
    id: "t2",
    name: "Transport fee structure",
    items: [
      { name: "Transport fee",   amount: 2500 },
      { name: "Fuel surcharge",  amount: 200  },
    ],
  },
  {
    id: "t3",
    name: "Annual fee structure",
    items: [
      { name: "Exam fee",       amount: 600   },
      { name: "Lab fee",        amount: 800   },
      { name: "Tuition fee",    amount: 10000 },
      { name: "Annual day fee", amount: 400   },
    ],
  },
  {
    id: "t4",
    name: "Hostel fee structure",
    items: [
      { name: "Hostel rent",     amount: 8000 },
      { name: "Mess fee",        amount: 3000 },
      { name: "Maintenance fee", amount: 500  },
    ],
  },
];

// Mock enrollment records for view page
export const MOCK_ENROLLMENTS: Record<string, EnrollmentRecord> = {
  "1": {
    enrollmentId: "ENR001",
    student: MOCK_STUDENTS[0],
    academicYear: "2026–2027",
    classId: "Class 1",
    division: "A",
    feeStructureName: "Standard fee structure",
    vehicleName: "Bus 01 · KL07AB1234",
    charges: [
      { id: "c1", chargeType: "Tuition fee",   originalAmount: 10000, finalAmount: 10000, paidAmount: 0, balanceAmount: 10000 },
      { id: "c2", chargeType: "Transport fee",  originalAmount: 2500,  finalAmount: 1800,  paidAmount: 0, balanceAmount: 1800  },
      { id: "c3", chargeType: "Book fee",       originalAmount: 2000,  finalAmount: 2000,  paidAmount: 0, balanceAmount: 2000  },
    ],
  },
};
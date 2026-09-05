export interface TechHub {
  id: string;
  name: string;
  state: string;
  keyDistricts: string[];
  description: string;
  companyCountEstimate: number;
}

export const INDIA_TOP_TECH_HUBS: TechHub[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru (Silicon Valley of India)',
    state: 'Karnataka',
    keyDistricts: ['Bengaluru Urban', 'Electronic City', 'Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Bellandur / Outer Ring Road'],
    description: 'Premier tech capital with highest concentration of AI startups, unicorns, R&D centers, and global GCCs.',
    companyCountEstimate: 4500,
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad (Cyberabad)',
    state: 'Telangana',
    keyDistricts: ['HITEC City', 'Gachibowli', 'Madhapur', 'Financial District', 'Kondapur'],
    description: 'Major hub for enterprise cloud, fintech, pharma-tech, AI research centers, and global tech campuses.',
    companyCountEstimate: 2800,
  },
  {
    id: 'pune',
    name: 'Pune (Oxford of the East & Engineering Hub)',
    state: 'Maharashtra',
    keyDistricts: ['Hinjawadi Infotech Park', 'Magarpatta Cybercity', 'Kharadi EON Free Zone', 'Baner / Balewadi', 'Viman Nagar'],
    description: 'Leading product engineering, automotive software, SaaS scaleup, and IT services epicenter.',
    companyCountEstimate: 2200,
  },
  {
    id: 'ncr',
    name: 'Delhi NCR (Gurugram & Noida Tech Corridor)',
    state: 'NCR',
    keyDistricts: ['Cyber City Gurugram', 'Golf Course Ext Rd', 'Noida Sector 62 & 125', 'South Delhi', 'Greater Noida Express'],
    description: 'Dominant hub for consumer internet unicorns, fintech, e-commerce, and enterprise SaaS giants.',
    companyCountEstimate: 3200,
  },
  {
    id: 'chennai',
    name: 'Chennai (SaaS Capital & IT Corridor)',
    state: 'Tamil Nadu',
    keyDistricts: ['Old Mahabalipuram Road (OMR)', 'Tidel Park Taramani', 'Guindy Industrial Estate', 'Siruseri SIPCOT', 'Ambattur'],
    description: 'Global SaaS capital (Zoho, Freshworks) and premier fintech/deep-tech engineering destination.',
    companyCountEstimate: 1900,
  },
  {
    id: 'mumbai',
    name: 'Mumbai & Navi Mumbai (Financial Tech Capital)',
    state: 'Maharashtra',
    keyDistricts: ['Bandra-Kurla Complex (BKC)', 'Andheri East / SEEPZ', 'Powai Hiranandani Tech Park', 'Airoli Mindspace', 'Lower Parel'],
    description: 'Fintech, banking technology, media-tech, and high-frequency trading headquarters.',
    companyCountEstimate: 2100,
  },
  {
    id: 'ahmedabad_gift',
    name: 'Ahmedabad & GIFT City',
    state: 'Gujarat',
    keyDistricts: ['GIFT City SEZ', 'SG Highway', 'Prahlad Nagar', 'Sanand Tech Zone'],
    description: 'Fastest growing international financial services tech zone (GIFT City) and cloud engineering hub.',
    companyCountEstimate: 950,
  },
  {
    id: 'kochi',
    name: 'Kochi (Infopark & Cyberpark Coast)',
    state: 'Kerala',
    keyDistricts: ['Infopark Kakkanad', 'SmartCity Kochi', 'Kalamassery', 'Vyttila'],
    description: 'Rapidly emerging IT export hub, product startups, and offshore development centers.',
    companyCountEstimate: 800,
  },
  {
    id: 'kolkata',
    name: 'Kolkata (East India Tech Hub)',
    state: 'West Bengal',
    keyDistricts: ['Salt Lake Sector V', 'New Town Action Area', 'Rajarhat IT Corridor'],
    description: 'Major regional tech services, analytics, and software consultancy cluster for Eastern India.',
    companyCountEstimate: 1100,
  },
  {
    id: 'jaipur_indore',
    name: 'Jaipur & Indore (Tier-2 Growth Corridor)',
    state: 'Rajasthan & MP',
    keyDistricts: ['Mahindra World City Jaipur', 'Sitapura IT Park', 'Super Corridor Indore', 'Crystal IT Park'],
    description: 'High-growth emerging startup clusters with top engineering talent and expanding tech parks.',
    companyCountEstimate: 750,
  },
];

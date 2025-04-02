interface VinApiResponse {
  Results: Array<{
    Value: string;
    ValueId: string;
    Variable: string;
    VariableId: number;
  }>;
}

interface DecodedVin {
  make: string;
  model: string;
  year: string;
  trim?: string;
  engine?: string;
  bodyType?: string;
  transmission?: string;
  fuelType?: string;
  vehicleType?: string;
  plantCity?: string;
  plantCountry?: string;
}

export async function decodeVin(vin: string): Promise<DecodedVin> {
  try {
    // Use the NHTSA API to decode the VIN
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`)

    if (!response.ok) {
      throw new Error("Failed to decode VIN")
    }

    const data = await response.json() as VinApiResponse

    // Extract relevant vehicle information
    const results = data.Results
    const vehicleInfo: DecodedVin = {
      make: "",
      model: "",
      year: ""
    }

    // Map the API response to our vehicle model
    results.forEach((result) => {
      const { Variable, Value } = result

      if (Value && Value !== "Not Applicable") {
        switch (Variable) {
          case "Make":
            vehicleInfo.make = Value
            break
          case "Model":
            vehicleInfo.model = Value
            break
          case "Model Year":
            vehicleInfo.year = Value
            break
          case "Body Class":
            vehicleInfo.bodyType = Value
            break
          case "Engine Model":
            vehicleInfo.engine = Value
            break
          case "Transmission Style":
            vehicleInfo.transmission = Value
            break
          case "Fuel Type - Primary":
            vehicleInfo.fuelType = Value
            break
          case "Vehicle Type":
            vehicleInfo.vehicleType = Value
            break
          case "Plant City":
            vehicleInfo.plantCity = Value
            break
          case "Plant Country":
            vehicleInfo.plantCountry = Value
            break
        }
      }
    })

    return vehicleInfo
  } catch (error) {
    console.error("Error decoding VIN:", error)
    throw new Error("Failed to decode VIN")
  }
}

// Function to validate a VIN
export function validateVIN(vin: string): boolean {
  // Basic VIN validation
  if (!vin || vin.length !== 17) {
    return false
  }

  // VIN should only contain alphanumeric characters (excluding I, O, Q)
  const validChars = /^[A-HJ-NPR-Z0-9]+$/
  if (!validChars.test(vin)) {
    return false
  }

  // More advanced validation could be added here

  return true
}

// Function to extract basic information from a VIN
export function extractBasicVINInfo(vin: string) {
  if (!validateVIN(vin)) {
    return null
  }

  // Extract basic information from the VIN
  const wmi = vin.substring(0, 3) // World Manufacturer Identifier
  const vds = vin.substring(3, 9) // Vehicle Descriptor Section
  const vis = vin.substring(9, 17) // Vehicle Identifier Section

  // Determine the model year from the 10th character
  const yearChar = vin.charAt(9)
  let modelYear = ""

  // This is a simplified year determination
  const yearCodes = {
    A: "2010",
    B: "2011",
    C: "2012",
    D: "2013",
    E: "2014",
    F: "2015",
    G: "2016",
    H: "2017",
    J: "2018",
    K: "2019",
    L: "2020",
    M: "2021",
    N: "2022",
    P: "2023",
    R: "2024",
    S: "2025",
    T: "2026",
    V: "2027",
    W: "2028",
    X: "2029",
    Y: "2030",
    1: "2001",
    2: "2002",
    3: "2003",
    4: "2004",
    5: "2005",
    6: "2006",
    7: "2007",
    8: "2008",
    9: "2009",
    0: "2000",
  }

  modelYear = yearCodes[yearChar as keyof typeof yearCodes] || "Unknown"

  return {
    vin,
    wmi,
    vds,
    vis,
    modelYear,
  }
}

export const decodeVIN = decodeVin;


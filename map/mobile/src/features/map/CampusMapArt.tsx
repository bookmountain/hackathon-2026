import { memo } from "react";
import { Ellipse, G, Path, Rect, Text } from "react-native-svg";
import { fontFamilies } from "@/theme";

// Illustrated Adelaide CBD from the design (#ucmap). Drawn in 390 × 660 map
// space; the background overscans so any crop (view box) stays filled.
function CampusMapArt() {
  return (
    <G>
      <Rect x={-400} y={-400} width={1200} height={1500} fill="#E8EDF8" />
      {/* Parklands ring around the city grid */}
      <Rect x={-400} y={-400} width={1200} height={520} fill="#DDEBEF" />
      <Rect x={-400} y={616} width={1200} height={500} fill="#DDEBEF" />
      <Rect x={-400} y={120} width={412} height={496} fill="#DDEBEF" />
      <Rect x={378} y={120} width={500} height={496} fill="#DDEBEF" />

      {/* Streets */}
      <G stroke="#F7F9FE" strokeLinecap="round" fill="none">
        <Path d="M100 60H300M60 20H320M120 0V110M230 0V110" strokeWidth={5} />
        <Path d="M176 0V612" strokeWidth={10} />
        <Path d="M12 250H378" strokeWidth={10} />
        <Path d="M12 322H378M12 400H378M12 478H378M12 560H378" strokeWidth={7} />
        <Path d="M12 612H378" strokeWidth={8} />
        <Path d="M40 250V612M105 250V612M245 250V612M310 250V612M360 250V612M320 130V250" strokeWidth={6} />
      </G>

      {/* River Torrens */}
      <Path d="M-60 132C40 104 110 152 190 134S320 100 460 126" stroke="#BCD3FF" strokeWidth={20} fill="none" strokeLinecap="round" />

      {/* Landmarks: Adelaide Oval, campuses, station, Rundle Mall, Victoria Square */}
      <Ellipse cx={150} cy={80} rx={34} ry={22} fill="#CFE2E8" stroke="#F7F9FE" strokeWidth={3} />
      <Rect x={214} y={148} width={100} height={94} rx={12} fill="#D3E0FF" />
      <Rect x={122} y={164} width={46} height={78} rx={10} fill="#D3E0FF" />
      <Rect x={28} y={204} width={88} height={40} rx={8} fill="#D8DFEE" />
      <Rect x={178} y={317} width={130} height={10} rx={5} fill="#D3E0FF" />
      <Rect x={150} y={498} width={52} height={42} rx={8} fill="#DDEBEF" stroke="#F7F9FE" strokeWidth={3} />

      <G fontFamily={fontFamilies[700]} fontSize={8.5} textAnchor="middle">
        <Text x={264} y={163} fill="#1646CC">University of Adelaide</Text>
        <Text x={145} y={178} fill="#1646CC">Flinders</Text>
        <Text x={145} y={188} fill="#1646CC">City</Text>
        <Text x={72} y={216} fill="#4A5B80">Adelaide Stn</Text>
        <Text x={150} y={83} fill="#4A5B80">Adelaide Oval</Text>
        <Text x={176} y={522} fill="#4A5B80">Victoria Sq</Text>
        <Text x={243} y={313} fill="#4A5B80">Rundle Mall</Text>
        <Text x={352} y={244} fill="#7A89A8">North Tce</Text>
        <Text x={70} y={40} fill="#7A89A8">North Adelaide</Text>
        <Text x={330} y={108} fill="#5E82D0" fontStyle="italic">River Torrens</Text>
        <Text x={350} y={606} fill="#7A89A8">South Tce</Text>
      </G>
    </G>
  );
}

// Static artwork: skip re-renders when pins or sheets change
export default memo(CampusMapArt);

// Extract React hooks and components
const { useState, useEffect } = React;
const {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ScatterChart, Scatter, ZAxis
} = Recharts;

const GAIDVisualization = () => {
  // Same state as before, just modified to work with browser fetch
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for user selections
  const [selectedVariable, setSelectedVariable] = useState('AIAS_mean_pre');
  const [xDemographic, setXDemographic] = useState('country');
  const [yDemographic, setYDemographic] = useState('AI_tech');
  const [showColorSettings, setShowColorSettings] = useState(false);
  
  // Color scale settings
  const [colorPoints, setColorPoints] = useState([
    { value: 1, color: '#2c7bb6' },    // Blue for low values
    { value: 3, color: '#abd9e9' },    // Light blue/cyan for medium values
    { value: 4, color: '#fdae61' },    // Orange for medium-high values
    { value: 5, color: '#d7191c' }     // Red for high values
  ]);
  
  // Separate color scale for feeling variables (percentages)
  const [feelingColorPoints, setFeelingColorPoints] = useState([
    { value: 0, color: '#edf8fb' },    // Very pale cyan for 0%
    { value: 25, color: '#b2e2e2' },   // Light cyan for 25%
    { value: 50, color: '#66c2a4' },   // Medium teal for 50%
    { value: 75, color: '#2ca25f' },   // Darker green for 75%
    { value: 100, color: '#006d2c' }   // Deep green for 100%
  ]);
  
  // Available options
  const variables = [
    // AI Attitudes
    'AIAS_mean_pre',
    'AIAS_life_pre',
    'AIAS_work_pre',
    'AIAS_futureuse_pre', 
    'AIAS_positive_pre',
    // AI Interest
    'AI_interest_mean',
    'AI_interest_curiosity',
    'AI_interest_general',
    'AI_interest_read',
    'AI_interest_watchlisten',
    // Feelings (binary variables)
    'feeling_pre_hopeful',
    'feeling_pre_confident',
    'feeling_pre_excited',
    'feeling_pre_relaxed',
    'feeling_pre_afraid',
    'feeling_pre_angry',
    'feeling_pre_nervous',
    'feeling_pre_frustrated',
    'feeling_pre_none of the above',
    'feeling_pre_Idontknow'
  ];
  
  // Check if a variable is a feeling parameter (binary)
  const isFeelingVar = (varName) => varName.startsWith('feeling_pre_');
  
  // Variable labels for display
  const variableLabels = {
    // AI Attitudes
    'AIAS_mean_pre': 'AI Attitude Score (overall average)',
    'AIAS_life_pre': 'Belief that AI will improve life',
    'AIAS_work_pre': 'Belief that AI will improve work',
    'AIAS_futureuse_pre': 'Intention to use AI in the future',
    'AIAS_positive_pre': 'Belief that AI is positive for humanity',
    // AI Interest
    'AI_interest_mean': 'Interest in AI (overall average)',
    'AI_interest_curiosity': 'Following AI with curiosity',
    'AI_interest_general': 'General interest in AI',
    'AI_interest_read': 'Interest in reading about AI',
    'AI_interest_watchlisten': 'Interest in watching/listening about AI',
    // Feelings
    'feeling_pre_hopeful': 'Feeling Hopeful about AI',
    'feeling_pre_confident': 'Feeling Confident about AI',
    'feeling_pre_excited': 'Feeling Excited about AI',
    'feeling_pre_relaxed': 'Feeling Relaxed about AI',
    'feeling_pre_afraid': 'Feeling Afraid about AI',
    'feeling_pre_angry': 'Feeling Angry about AI',
    'feeling_pre_nervous': 'Feeling Nervous about AI',
    'feeling_pre_frustrated': 'Feeling Frustrated about AI',
    'feeling_pre_none of the above': 'None of the listed feelings',
    'feeling_pre_Idontknow': 'Unsure about feelings'
  };
  
  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
    // Remove the hash if it exists
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  };
  
  // Helper function to convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  // Interpolate between two colors
  const interpolateColor = (color1, color2, factor) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const r = rgb1.r + factor * (rgb2.r - rgb1.r);
    const g = rgb1.g + factor * (rgb2.g - rgb1.g);
    const b = rgb1.b + factor * (rgb2.b - rgb1.b);
    
    return rgbToHex(r, g, b);
  };
  
  // Demographics labels for display
  const demographicLabels = {
    country: 'Country',
    AI_tech: 'AI Technology',
    gender: 'Gender',
    age: 'Age Group',
    education: 'Education Level'
  };
  
  // Load data from the JSON file
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Modified to use fetch instead of window.fs
        const response = await fetch('./data/gaid_data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const parsedData = await response.json();
        setData(parsedData);
        setLoading(false);
      } catch (err) {
        setError('Error loading data: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Process data for visualization
  const processData = () => {
    if (!data.length) return { gridData: [], xData: [], yData: [] };
    
    // Get unique values for x and y demographics and sort them in the desired order
    const getOrderedCategories = (demographic) => {
      const uniqueValues = [...new Set(data.map(item => item[demographic]))];
      
      // Define custom sort orders for specific demographics
      if (demographic === 'gender') {
        const genderOrder = ['Female', 'Male', 'Diverse', 'Prefer not to say'];
        return uniqueValues.sort((a, b) => genderOrder.indexOf(a) - genderOrder.indexOf(b));
      } 
      else if (demographic === 'age') {
        const ageOrder = ['<25', '25-34', '35-44', '45-54', '>55', 'Prefer not to say'];
        return uniqueValues.sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
      } 
      else if (demographic === 'education') {
        const educationOrder = ['No university degree', 'Bachelor', 'Master and above', 'Prefer not to say'];
        return uniqueValues.sort((a, b) => educationOrder.indexOf(a) - educationOrder.indexOf(b));
      }
      
      // Default to alphabetical sorting for other demographics
      return uniqueValues.sort();
    };
    
    const xCategories = getOrderedCategories(xDemographic);
    const yCategories = getOrderedCategories(yDemographic);
    
    // Calculate grid data for the heatmap
    const gridData = [];
    xCategories.forEach(xCat => {
      yCategories.forEach(yCat => {
        const filteredItems = data.filter(
          item => item[xDemographic] === xCat && item[yDemographic] === yCat
        );
        
        const validValues = filteredItems
          .map(item => item[selectedVariable])
          .filter(val => val !== null && val !== undefined);
        
        // For feeling variables, convert to percentage (0-100)
        // For other variables, keep as average (1-5)
        const average = validValues.length 
          ? (isFeelingVar(selectedVariable) 
              ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100
              : validValues.reduce((sum, val) => sum + val, 0) / validValues.length)
          : 0;
        
        gridData.push({
          x: xCat,
          y: yCat,
          value: average,
          count: validValues.length,
          isFeeling: isFeelingVar(selectedVariable)
        });
      });
    });
    
    // Calculate data for x-axis marginal plot
    const xData = xCategories.map(xCat => {
      const filteredItems = data.filter(item => item[xDemographic] === xCat);
      const validValues = filteredItems
        .map(item => item[selectedVariable])
        .filter(val => val !== null && val !== undefined);
      
      // For feeling variables, convert to percentage (0-100)
      // For other variables, keep as average (1-5)
      const value = validValues.length
        ? (isFeelingVar(selectedVariable)
            ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100
            : validValues.reduce((sum, val) => sum + val, 0) / validValues.length)
        : 0;
      
      return {
        category: xCat,
        value: value,
        count: validValues.length,
        isFeeling: isFeelingVar(selectedVariable)
      };
    });
    
    // Calculate data for y-axis marginal plot
    const yData = yCategories.map(yCat => {
      const filteredItems = data.filter(item => item[yDemographic] === yCat);
      const validValues = filteredItems
        .map(item => item[selectedVariable])
        .filter(val => val !== null && val !== undefined);
      
      // For feeling variables, convert to percentage (0-100)
      // For other variables, keep as average (1-5)
      const value = validValues.length
        ? (isFeelingVar(selectedVariable)
            ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100
            : validValues.reduce((sum, val) => sum + val, 0) / validValues.length)
        : 0;
      
      return {
        category: yCat,
        value: value,
        count: validValues.length,
        isFeeling: isFeelingVar(selectedVariable)
      };
    });
    
    return { gridData, xData, yData };
  };
  
  const { gridData, xData, yData } = processData();
  
  // Get color from custom interpolated scale based on variable type
  const getCustomColor = (value, isFeeling = false) => {
    // Choose the appropriate color points based on variable type
    const points = isFeeling ? feelingColorPoints : colorPoints;
    
    // Sort color points by value (in case they were modified)
    const sortedPoints = [...points].sort((a, b) => a.value - b.value);
    
    // Find the color points between which our value falls
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      if (value >= sortedPoints[i].value && value <= sortedPoints[i + 1].value) {
        // Calculate interpolation factor
        const range = sortedPoints[i + 1].value - sortedPoints[i].value;
        const factor = range !== 0 ? (value - sortedPoints[i].value) / range : 0;
        
        // Interpolate color
        return interpolateColor(sortedPoints[i].color, sortedPoints[i + 1].color, factor);
      }
    }
    
    // If value is outside the range, return the first or last color
    if (value < sortedPoints[0].value) return sortedPoints[0].color;
    return sortedPoints[sortedPoints.length - 1].color;
  };
  
  // Generate colors for the legend gradient
  const generateGradientColors = (steps = 20, isFeeling = false) => {
    const colors = [];
    
    if (isFeeling) {
      // For feeling variables: 0-100%
      for (let i = 0; i < steps; i++) {
        const value = (i / (steps - 1)) * 100; // Values from 0 to 100
        colors.push(getCustomColor(value, true));
      }
    } else {
      // For attitude/interest variables: 1-5 scale
      for (let i = 0; i < steps; i++) {
        const value = 1 + (i / (steps - 1)) * 4; // Values from 1 to 5
        colors.push(getCustomColor(value, false));
      }
    }
    
    return colors;
  };
  
  const gradientColors = generateGradientColors(20, isFeelingVar(selectedVariable));
  
  // Custom tooltip components
  const CustomGridTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-gray-700 mb-1">Demographic Group:</p>
          <p className="text-sm">{data.x} × {data.y}</p>
          <div className="h-px bg-gray-200 my-2"></div>
          {data.isFeeling ? (
            <p className="text-sm"><span className="font-medium">Percentage:</span> {data.value.toFixed(1)}%</p>
          ) : (
            <p className="text-sm"><span className="font-medium">Average Score:</span> {data.value.toFixed(2)}/5</p>
          )}
          <p className="text-sm"><span className="font-medium">Number of Respondents:</span> {data.count}</p>
        </div>
      );
    }
    return null;
  };
  
  const CustomBarTooltip = ({ active, payload, label, axisType }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-gray-700 mb-1">{data.category}</p>
          <div className="h-px bg-gray-200 my-2"></div>
          {data.isFeeling ? (
            <p className="text-sm"><span className="font-medium">Percentage:</span> {data.value.toFixed(1)}%</p>
          ) : (
            <p className="text-sm"><span className="font-medium">Average Score:</span> {data.value.toFixed(2)}/5</p>
          )}
          <p className="text-sm"><span className="font-medium">Number of Respondents:</span> {data.count}</p>
        </div>
      );
    }
    return null;
  };
  
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-2">Loading GAID survey data...</p>
    </div>
  );
  
  if (error) return (
    <div className="p-4 text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold mb-2 text-center">Global AI Dialogues (GAID) Survey Dashboard</h1>
          <p className="text-center text-gray-600 mb-4">
            Explore survey results from workshops on generative AI (genAI) and Facial Processing Technology (FPT) 
            across six countries: Germany, Japan, India, Nigeria, Mexico, and Bolivia
          </p>
          
          {/* Controls */}
          <div className="mb-6 flex flex-wrap gap-4 justify-center">
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Variable to Visualize
              </label>
              <select 
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <optgroup label="AI Attitudes">
                  <option value="AIAS_mean_pre">{variableLabels['AIAS_mean_pre']}</option>
                  <option value="AIAS_life_pre">{variableLabels['AIAS_life_pre']}</option>
                  <option value="AIAS_work_pre">{variableLabels['AIAS_work_pre']}</option>
                  <option value="AIAS_futureuse_pre">{variableLabels['AIAS_futureuse_pre']}</option>
                  <option value="AIAS_positive_pre">{variableLabels['AIAS_positive_pre']}</option>
                </optgroup>
                <optgroup label="AI Interest">
                  <option value="AI_interest_mean">{variableLabels['AI_interest_mean']}</option>
                  <option value="AI_interest_curiosity">{variableLabels['AI_interest_curiosity']}</option>
                  <option value="AI_interest_general">{variableLabels['AI_interest_general']}</option>
                  <option value="AI_interest_read">{variableLabels['AI_interest_read']}</option>
                  <option value="AI_interest_watchlisten">{variableLabels['AI_interest_watchlisten']}</option>
                </optgroup>
                <optgroup label="Feelings about AI">
                  <option value="feeling_pre_hopeful">{variableLabels['feeling_pre_hopeful']}</option>
                  <option value="feeling_pre_confident">{variableLabels['feeling_pre_confident']}</option>
                  <option value="feeling_pre_excited">{variableLabels['feeling_pre_excited']}</option>
                  <option value="feeling_pre_relaxed">{variableLabels['feeling_pre_relaxed']}</option>
                  <option value="feeling_pre_afraid">{variableLabels['feeling_pre_afraid']}</option>
                  <option value="feeling_pre_angry">{variableLabels['feeling_pre_angry']}</option>
                  <option value="feeling_pre_nervous">{variableLabels['feeling_pre_nervous']}</option>
                  <option value="feeling_pre_frustrated">{variableLabels['feeling_pre_frustrated']}</option>
                  <option value="feeling_pre_none of the above">{variableLabels['feeling_pre_none of the above']}</option>
                  <option value="feeling_pre_Idontknow">{variableLabels['feeling_pre_Idontknow']}</option>
                </optgroup>
              </select>
            </div>
            
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X-Axis Demographic
              </label>
              <select 
                value={xDemographic}
                onChange={(e) => setXDemographic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.keys(demographicLabels).map(option => (
                  <option key={option} value={option}>{demographicLabels[option]}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y-Axis Demographic
              </label>
              <select 
                value={yDemographic}
                onChange={(e) => setYDemographic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.keys(demographicLabels).map(option => (
                  <option key={option} value={option}>{demographicLabels[option]}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full flex justify-center">
              <button
                onClick={() => setShowColorSettings(!showColorSettings)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {showColorSettings ? 'Hide Color Settings' : 'Customize Color Scale'}
              </button>
            </div>
            
            {showColorSettings && (
              <div className="w-full bg-gray-100 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-3">Color Scale Customization</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isFeelingVar(selectedVariable) 
                    ? "Set points on the percentage scale (0-100%) to customize the feeling visualization."
                    : "Set points on the scale (1-5) to customize the visualization."
                  }
                </p>
                
                {isFeelingVar(selectedVariable) ? (
                  // Feeling color customization (0-100%)
                  feelingColorPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Point {index + 1} Value:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={point.value}
                          onChange={(e) => {
                            const newPoints = [...feelingColorPoints];
                            newPoints[index].value = parseFloat(e.target.value);
                            setFeelingColorPoints(newPoints);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color:
                        </label>
                        <input
                          type="color"
                          value={point.color}
                          onChange={(e) => {
                            const newPoints = [...feelingColorPoints];
                            newPoints[index].color = e.target.value;
                            setFeelingColorPoints(newPoints);
                          }}
                          className="w-full h-10 p-0 border border-gray-300 rounded-md shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  // Regular color customization (1-5)
                  colorPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Point {index + 1} Value:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={point.value}
                          onChange={(e) => {
                            const newPoints = [...colorPoints];
                            newPoints[index].value = parseFloat(e.target.value);
                            setColorPoints(newPoints);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color:
                        </label>
                        <input
                          type="color"
                          value={point.color}
                          onChange={(e) => {
                            const newPoints = [...colorPoints];
                            newPoints[index].color = e.target.value;
                            setColorPoints(newPoints);
                          }}
                          className="w-full h-10 p-0 border border-gray-300 rounded-md shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>
                  ))
                )}
                
                <div className="mt-4 flex justify-between">
                  <div className="flex items-center">
                    <div className="w-48 h-6 rounded-md flex">
                      {gradientColors.map((color, i) => (
                        <div 
                          key={i} 
                          className="flex-1" 
                          style={{ backgroundColor: color }}
                        ></div>
                      ))}
                    </div>
                    <span className="ml-2 text-sm">Preview</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (isFeelingVar(selectedVariable)) {
                        setFeelingColorPoints([
                            { value: 0, color: '#edf8fb' },    // Very pale cyan for 0%
                            { value: 25, color: '#b2e2e2' },   // Light cyan for 25%
                            { value: 50, color: '#66c2a4' },   // Medium teal for 50%
                            { value: 75, color: '#2ca25f' },   // Darker green for 75%
                            { value: 100, color: '#006d2c' }   // Deep green for 100%
                        ]);
                      } else {
                        setColorPoints([
                            { value: 1, color: '#2c7bb6' },    // Blue for low values
                            { value: 3, color: '#abd9e9' },    // Light blue/cyan for medium values
                            { value: 4, color: '#fdae61' },    // Orange for medium-high values
                            { value: 5, color: '#d7191c' }     // Red for high values
                        ]);
                      }
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Visualization Grid */}
          <div className="flex">
            {/* Empty top-left corner */}
            <div className="w-16 h-16"></div>
            
            {/* Top margin plot (X demographic) - INCREASED HEIGHT FURTHER */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={xData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={false} />
                  <YAxis 
                    domain={isFeelingVar(selectedVariable) ? [0, 100] : [1, 5]} 
                    label={{ 
                      value: isFeelingVar(selectedVariable) ? 'Percentage (%)' : 'Average Score', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                    ticks={isFeelingVar(selectedVariable) 
                      ? [0, 25, 50, 75, 100] 
                      : [1, 2, 3, 4, 5]
                    }
                  />
                  <Tooltip 
                    content={<CustomBarTooltip axisType="x" />}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {xData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCustomColor(entry.value, entry.isFeeling)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex">
            {/* Main scatter plot (grid) - no left margin plot */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={450}>
                <ScatterChart
                  margin={{ top: 10, right: 30, bottom: 40, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="category" 
                    dataKey="x" 
                    name={demographicLabels[xDemographic]} 
                    allowDuplicatedCategory={false}
                    label={{ value: demographicLabels[xDemographic], position: 'bottom', dy: 20 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="y" 
                    name={demographicLabels[yDemographic]} 
                    allowDuplicatedCategory={false}
                    label={{ value: demographicLabels[yDemographic], angle: -90, position: 'left', dx: -40 }}
                    tick={{ fontSize: 12 }}
                  />
                  <ZAxis dataKey="count" range={[100, 2000]} name="Number of Responses" />
                  <Tooltip content={<CustomGridTooltip />} />
                  <Scatter 
                    name="Survey Results" 
                    data={gridData} 
                    fill="#8884d8"
                    shape="circle"
                  >
                    {gridData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCustomColor(entry.value, entry.isFeeling)} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Color Scale Legend */}
          <div className="mt-6 flex justify-center">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-2">
                {isFeelingVar(selectedVariable) ? 'Percentage Scale' : 'Average Score Scale'}
              </p>
              <div className="flex items-center">
                <span className="text-xs mr-2">{isFeelingVar(selectedVariable) ? '0%' : '1'}</span>
                <div className="h-4 w-64 rounded flex">
                  {gradientColors.map((color, i) => (
                    <div 
                      key={i} 
                      className="flex-1" 
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
                <span className="text-xs ml-2">{isFeelingVar(selectedVariable) ? '100%' : '5'}</span>
              </div>
              <div className="flex justify-between w-64 px-1">
                <span className="text-xs">Low</span>
                <span className="text-xs">Medium</span>
                <span className="text-xs">High</span>
              </div>
              {!showColorSettings && (
                <button
                  onClick={() => setShowColorSettings(true)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Customize colors
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              <strong>What you're seeing:</strong> This visualization shows 
              {isFeelingVar(selectedVariable) 
                ? ` the percentage of participants who reported feeling "${variableLabels[selectedVariable].replace('Feeling ', '')}"` 
                : ` the average ${variableLabels[selectedVariable]} (scale 1-5)`
              } 
              across different demographic groups.
            </p>
            <p>
              <strong>How to read it:</strong> Each circle represents a unique combination of {demographicLabels[xDemographic]} (x-axis) and {demographicLabels[yDemographic]} (y-axis).
              The top bar chart shows the {isFeelingVar(selectedVariable) ? 'percentages' : 'average scores'} for each {demographicLabels[xDemographic]} category.
              Larger circles indicate more respondents in that category. Color indicates the {isFeelingVar(selectedVariable) ? 'percentage' : 'average score'} using the customizable color scale above.
            </p>
            <p>
              <strong>Interact:</strong> Hover over any circle or bar for detailed information. Change the selections above to explore different aspects of the data.
              Use the color customization options to highlight specific ranges of values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Render the component to the DOM
ReactDOM.render(<GAIDVisualization />, document.getElementById('root'));
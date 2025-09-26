import React, { useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
const logoXml = `
<svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" xmlns:xlink="http://www.w3.org/1999/xlink" id="Layer_1" x="0px" y="0px" viewBox="0 0 1200 867" style="enable-background:new 0 0 1200 867;" xml:space="preserve"><style type="text/css">	.st0{fill:#48479B;}</style><g>	<g>		
<path class="st0" d="M635.2,295.1c-138.6,0-166.5,65.2-166.5,273.1c0,235.1,27.9,273.8,165,273.8c139.4,0,166.5-31.5,166.5-273.8   C800.2,336.7,780.9,295.1,635.2,295.1z M572.2,443.4c-0.4-15.1,20.1-15.2,20-0.3c0.2,19.6,0.1,39.3,0,58.9c0,7.3-4,11.6-10.3,11.8   c-5.8,0.2-9.4-4-9.5-11.5c-0.1-9.9,0-19.9,0-29.8h-0.2C572.1,462.8,572,453.1,572.2,443.4z M632.4,518c-0.2,11-6.1,19.5-14.9,25.3   c-7.6,5-10.1,11.3-9.9,20c1.5,48,2.8,96,4,143.9c0.4,15.1-8.5,27-22.1,30.4c-20,5-37.7-10-37.1-31.7c0.6-24.2,3.7-120.2,4-143.9   c0.1-8-2.3-13.7-9.1-18.3c-10.6-7.1-16.2-17.3-16.2-30.4c0.2-23.1,0.2-46.2,0.3-69.3c-0.4-16.5,20.5-16.3,20.1,0.3   c0.2,22.4,0.4,44.8,0.3,67.2c0,7.2,2.4,12.4,8.4,16.6c11.4,8,16.6,19.1,16.2,33.2c-1.3,49.3-3.3,98.7-3.9,148c1,5.5,4,9.4,10,9   c5.9-0.3,9-4.1,9-9.9c-0.7-49.4-2.7-98.7-3.9-148c-0.3-13.1,4.5-23.8,15.4-31.5c6.8-4.7,9.9-10.6,9.6-19.4   c-0.6-22.4-0.1-44.8,0.1-67.2c0.1-6.4,4.3-10.6,10-10.5c5.4,0.1,9.7,3.9,9.7,10.1C632.8,467.4,632.8,492.7,632.4,518z    M736.3,523.8c-2.8,4.3-5.8,8.7-9.6,12.1c-4.8,4.4-6.3,9.4-6,15.7c1.3,25.7,3.5,128,4.3,153.3c1.1,44.4-60.4,45.2-60.2,0.7   c1.2-51.3,2.6-102.7,4.2-154c0.2-6.6-1.5-11.4-6.3-16.2c-24.5-24.4-25.4-69.6-2.2-95.3c19.8-21.8,49.2-21.8,69,0.1   C748.9,461.8,752,499,736.3,523.8z M672,457.6c-9,13.4-10.4,28.5-6.1,43.5c2,7.1,5.7,14.8,10.9,19.8c8.7,8.2,12.6,17.3,12.2,28.8   c-0.6,21.2-2.6,60-3.6,72.2c-0.3,3.7-0.5,7.5-0.5,11.2c0,23.1,0.1,46.2,0,69.3c0,10.7,3.2,16.1,10.1,16.1   c7,0.1,10.4-5.2,10.1-15.9c-1.4-51.1-2.7-102.3-4.2-153.4c-0.3-10.4,2.9-18.9,10.4-26.2c17-16.4,19.8-45.9,6.5-65.5   C705.5,439.2,684.2,439.2,672,457.6z"></path>
	</g></g></svg>
`;
export function FlipCircle() {
    const flipAnim = useRef(new Animated.Value(0)).current;

    // Interpolate rotation
    const rotateY = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Front and back opacity interpolation
    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    useEffect(() => {
        const flipLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(flipAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.delay(1400), // wait 1.4s before flipping back
                Animated.timing(flipAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.delay(1400),
            ])
        );
        flipLoop.start();

        return () => flipLoop.stop();
    }, []);

    return (
        <Animated.View style={[styles.circle, { transform: [{ rotateY }] }]}>
            <Animated.View
                style={[
                    styles.face,
                    { opacity: frontOpacity, backfaceVisibility: 'hidden', position: 'absolute',  marginBottom: 20,marginRight: 6},
                ]}
            >
               <SvgXml xml={logoXml} width={90} height={90} />
            </Animated.View>
            <Animated.View
                style={[
                    styles.face,
                    { opacity: backOpacity, backfaceVisibility: 'hidden', position: 'absolute' },
                ]}
            >
                <Text style={styles.text}>Know More</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    circle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#48479B',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#A3D397',
        borderWidth: 2,
        overflow: 'hidden',
    },
    face: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
});

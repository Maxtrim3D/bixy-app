package com.bixyapp

import android.app.Application
import com.bixyapp.wireguard.WireGuardPackage
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import com.oblador.vectoricons.VectorIconsPackage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage
import com.reactnativecommunity.netinfo.NetInfoPackage
import com.swmansion.gesturehandler.RNGestureHandlerPackage
import com.swmansion.reanimated.ReanimatedPackage
import com.swmansion.rnscreens.RNScreensPackage
import com.th3rdwave.safeareacontext.SafeAreaContextPackage

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            // Packages listed explicitly instead of relying on the auto-generated PackageList,
            // which requires GenerateAutolinkingPackageListTask to run (not reliable in CI).
            override fun getPackages(): List<ReactPackage> = listOf(
                MainReactPackage(),
                SafeAreaContextPackage(),
                RNScreensPackage(),
                RNGestureHandlerPackage(),
                ReanimatedPackage(),
                AsyncStoragePackage(),
                VectorIconsPackage(),
                NetInfoPackage(),
                WireGuardPackage()
            )

            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) load()
    }
}

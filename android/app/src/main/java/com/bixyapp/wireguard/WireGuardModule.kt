package com.bixyapp.wireguard

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import java.io.StringReader

class WireGuardModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WireGuardModule"

    companion object {
        private const val VPN_PERMISSION_REQUEST = 1337
        private var backend: GoBackend? = null
        private var activeTunnel: AppTunnel? = null
    }

    /** Simple Tunnel implementation — the name is arbitrary. */
    inner class AppTunnel(private val tunnelName: String) : Tunnel {
        override fun getName() = tunnelName
        override fun onStateChange(newState: Tunnel.State) {
            // Optionally emit events here
        }
    }

    @ReactMethod
    fun connect(configStr: String, promise: Promise) {
        try {
            // 1. Ensure VPN permission is granted
            val intent = VpnService.prepare(reactContext)
            if (intent != null) {
                // Need to ask user — forward to activity
                currentActivity?.startActivityForResult(intent, VPN_PERMISSION_REQUEST)
                // For v1, resolve after delay; production should use ActivityEventListener
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    connectInternal(configStr, promise)
                }, 2000)
                return
            }
            connectInternal(configStr, promise)
        } catch (e: Exception) {
            promise.reject("WG_ERROR", "Connect failed: ${e.message}", e)
        }
    }

    private fun connectInternal(configStr: String, promise: Promise) {
        try {
            if (backend == null) {
                backend = GoBackend(reactContext)
            }
            val config = Config.parse(StringReader(configStr))
            val tunnel = AppTunnel("bixy")
            activeTunnel = tunnel
            backend!!.setState(tunnel, Tunnel.State.UP, config)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WG_ERROR", "Tunnel start failed: ${e.message}", e)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            val t = activeTunnel ?: run { promise.resolve(null); return }
            val b = backend ?: run { promise.resolve(null); return }
            b.setState(t, Tunnel.State.DOWN, null)
            activeTunnel = null
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WG_ERROR", "Disconnect failed: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        try {
            val t = activeTunnel ?: run { promise.resolve(false); return }
            val b = backend ?: run { promise.resolve(false); return }
            promise.resolve(b.getState(t) == Tunnel.State.UP)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
